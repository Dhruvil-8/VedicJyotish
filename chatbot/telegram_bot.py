import os
import logging
import json
import secrets
import httpx
import asyncio
from contextlib import asynccontextmanager
from datetime import datetime
from dotenv import load_dotenv
from fastapi import FastAPI, Request, HTTPException
import uvicorn

# We use the python-telegram-bot library
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    CallbackQueryHandler,
    ConversationHandler,
    ContextTypes,
    filters,
)

# Load environment variables
load_dotenv()
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
# When running in the same Docker container, the bot can call the API locally on localhost!
BACKEND_URL = os.getenv("BACKEND_URL", "http://127.0.0.1:7860")
# A random secret generated per boot to authenticate Telegram webhook calls
WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", secrets.token_hex(32))
API_SECRET_KEY = os.getenv("API_SECRET_KEY")

def get_api_headers() -> dict:
    headers = {}
    if API_SECRET_KEY:
        headers["X-API-Key"] = API_SECRET_KEY
    return headers

# Max input length for user messages to prevent abuse
MAX_INPUT_LENGTH = 500

# Enable logging (production-safe: reduce noise to protect user data in logs)
ENVIRONMENT = os.getenv("ENVIRONMENT", "production")
log_level = logging.WARNING if ENVIRONMENT == "production" else logging.INFO
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=log_level
)
logger = logging.getLogger(__name__)

# Conversation states
STATE_DATE, STATE_TIME, STATE_CITY, STATE_CHAT = range(4)

# ----------------- Helper Functions -----------------

async def safe_reply_markdown(message_or_query, text: str, is_edit: bool = False):
    """Send a Markdown message with automatic fallback to plain text.
    
    Telegram's MarkdownV1 parser is strict — if the AI response contains
    unescaped *, _, `, or [ characters, the API throws a 400 error.
    This helper catches that and retries without parse_mode.
    """
    try:
        if is_edit:
            return await message_or_query.edit_message_text(text, parse_mode="Markdown")
        else:
            return await message_or_query.reply_text(text, parse_mode="Markdown")
    except Exception:
        # Fallback: strip Markdown and send as plain text
        if is_edit:
            return await message_or_query.edit_message_text(text)
        else:
            return await message_or_query.reply_text(text)

def _split_text_safely(text: str, max_len: int = 4000) -> list:
    """Split long text on paragraph boundaries to avoid breaking Markdown mid-tag.
    
    Naive splitting at a fixed character offset (e.g. text[i:i+4000]) can
    cut through **bold** or *italic* markers, causing Telegram parse errors.
    This splits on double-newlines (paragraph breaks) first, falling back to
    single newlines, then hard character boundaries.
    """
    if len(text) <= max_len:
        return [text]
    
    parts = []
    while text:
        if len(text) <= max_len:
            parts.append(text)
            break
        
        # Try to split at a paragraph boundary (\n\n)
        split_pos = text.rfind("\n\n", 0, max_len)
        if split_pos == -1:
            # Fallback: split at a single newline
            split_pos = text.rfind("\n", 0, max_len)
        if split_pos == -1:
            # Last resort: split at a space
            split_pos = text.rfind(" ", 0, max_len)
        if split_pos == -1:
            # Absolute last resort: hard cut
            split_pos = max_len
        
        parts.append(text[:split_pos].rstrip())
        text = text[split_pos:].lstrip()
    
    return parts

async def search_city(city_query: str) -> list:
    """Queries the backend city search endpoint."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{BACKEND_URL}/search_city", 
                params={"query": city_query},
                headers=get_api_headers(),
                timeout=10.0
            )
            if response.status_code == 200:
                return response.json()
        except Exception as e:
            logger.error(f"Error searching city: {e}")
        return []

async def calculate_chart(birth_data: dict) -> dict:
    """Queries the backend chart calculation endpoint."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{BACKEND_URL}/calculate_chart",
                json=birth_data,
                headers=get_api_headers(),
                timeout=15.0
            )
            if response.status_code == 200:
                return response.json()
        except Exception as e:
            logger.error(f"Error calculating chart: {e}")
        return {}

async def chat_with_astrologer(chart_data: dict, question: str, history: list) -> str:
    """Queries the backend chat endpoint and returns AI RISHI's answer."""
    async with httpx.AsyncClient() as client:
        try:
            payload = {
                "chart_data": chart_data,
                "question": question,
                "history": history
            }
            response_text = ""
            async with client.stream("POST", f"{BACKEND_URL}/chat_with_astrologer", json=payload, headers=get_api_headers(), timeout=60.0) as response:
                if response.status_code == 200:
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data_str = line[6:]
                            try:
                                data_json = json.loads(data_str)
                                if "text" in data_json:
                                    response_text += data_json["text"]
                                elif data_json.get("done"):
                                    break
                                elif "error" in data_json:
                                    return f"The astrologer service encountered an issue. Please try again."
                            except json.JSONDecodeError:
                                pass
                    return response_text.strip() if response_text.strip() else "I received an empty reading. Please rephrase your question and try again."
                elif response.status_code == 429:
                    return "The astrologer is receiving many consultations right now. Please wait a moment and try again."
                else:
                    return "I'm sorry, I could not connect to the astrologer service. Please try again later."
        except httpx.TimeoutException:
            logger.error("Timeout calling chat_with_astrologer")
            return "The consultation is taking longer than expected. Please try a shorter question."
        except Exception as e:
            logger.error(f"Error calling chat_with_astrologer: {type(e).__name__}")
            return "I encountered an error trying to consult the celestial stars. Please try again."

async def generate_full_report(chart_data: dict) -> str:
    """Queries the backend report generator and aggregates the SSE stream."""
    async with httpx.AsyncClient() as client:
        try:
            response_text = ""
            async with client.stream("POST", f"{BACKEND_URL}/generate_report", json=chart_data, headers=get_api_headers(), timeout=90.0) as response:
                if response.status_code == 200:
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data_str = line[6:]
                            try:
                                data_json = json.loads(data_str)
                                if "text" in data_json:
                                    response_text += data_json["text"]
                                elif data_json.get("done"):
                                    break
                                elif "error" in data_json:
                                    return "Report generation encountered an issue. Please try again."
                            except json.JSONDecodeError:
                                pass
                    return response_text.strip() if response_text.strip() else "Report came back empty. Please try again."
        except httpx.TimeoutException:
            logger.error("Timeout generating report")
            return "Report generation timed out. The server might be busy — please try again in a moment."
        except Exception as e:
            logger.error(f"Error generating report: {type(e).__name__}")
        return "Failed to generate your Vedic Astrology report. Please try again later."


# ----------------- Command Handlers -----------------

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Starts the conversation and asks for the birth date."""
    user = update.effective_user
    await update.message.reply_text(
        f"✨ *Welcome to Vedic Astrology Bot, {user.first_name}!* ✨\n\n"
        "I can compute your Vedic birth chart (Kundli), outline your Nakshatras and planetary yogas, "
        "and connect you directly to AI RISHI.\n\n"
        "To get started, please tell me your **Date of Birth** in **DD/MM/YYYY** format:",
        parse_mode="Markdown"
    )
    context.user_data.clear()
    return STATE_DATE

async def handle_date(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Validates and stores the birth date."""
    date_str = update.message.text.strip()
    try:
        dt = datetime.strptime(date_str, "%d/%m/%Y")
        if dt.year < 1900 or dt > datetime.now():
            raise ValueError()
    except ValueError:
        await update.message.reply_text(
            "❌ *Invalid date format.*\n"
            "Please provide a valid date between 1900 and today in **DD/MM/YYYY** format (e.g., `25/12/1995`):",
            parse_mode="Markdown"
        )
        return STATE_DATE

    context.user_data["date"] = date_str
    await update.message.reply_text(
        "🕒 Great! Now, enter your **Time of Birth** in 24-hour **HH:MM** format (e.g., `14:30`):",
        parse_mode="Markdown"
    )
    return STATE_TIME

async def handle_time(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Validates and stores the birth time."""
    time_str = update.message.text.strip()
    try:
        parts = time_str.replace(";", ":").replace(".", ":").split(":")
        h, m = int(parts[0]), int(parts[1])
        if not (0 <= h <= 23 and 0 <= m <= 59):
            raise ValueError()
        time_str = f"{h:02d}:{m:02d}"
    except (ValueError, IndexError):
        await update.message.reply_text(
            "❌ *Invalid time format.*\n"
            "Please enter your birth time in 24-hour **HH:MM** format (e.g., `18:45`):",
            parse_mode="Markdown"
        )
        return STATE_TIME

    context.user_data["time"] = time_str
    await update.message.reply_text(
        "📍 Excellent. Finally, enter your **City/Place of Birth** (e.g., `Mumbai`):",
        parse_mode="Markdown"
    )
    return STATE_CITY

async def handle_city(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Resolves city using `/search_city` and calculates the chart."""
    city_name = update.message.text.strip()

    # Sanitize: city name should be reasonable length and not contain injection chars
    if len(city_name) > 100 or not city_name:
        await update.message.reply_text(
            "❌ *Invalid city name.*\nPlease enter a valid city name (max 100 characters):",
            parse_mode="Markdown"
        )
        return STATE_CITY

    await update.message.reply_text("🔍 _Searching for city coordinates and drawing up the skies..._", parse_mode="Markdown")
    
    cities = await search_city(city_name)
    if not cities:
        await update.message.reply_text(
            "❌ *City not found.*\n"
            "Please try a different, nearby city or check the spelling:",
            parse_mode="Markdown"
        )
        return STATE_CITY
    
    selected_city = cities[0]
    lat = selected_city["lat"]
    lon = selected_city["lon"]
    resolved_name = selected_city["name"]
    
    context.user_data["city"] = resolved_name
    context.user_data["lat"] = lat
    context.user_data["lon"] = lon

    date = context.user_data.get("date")
    time = context.user_data.get("time")

    # Validate presence of required birth data

    if not date or not time:
        await update.message.reply_text(
            "⚠️ *Session Expired or Reset.*\n"
            "It seems your birth details session has expired or the server recently restarted.\n"
            "Please start over by typing /start!",
            parse_mode="Markdown"
        )
        return ConversationHandler.END

    birth_data = {
        "date": date,
        "time": time,
        "city": resolved_name,
        "lat": lat,
        "lon": lon
    }
    
    await update.message.reply_text("🪐 _Calculating planetary longitudes, Nakshatras, and D1/D9 charts..._", parse_mode="Markdown")
    
    chart_result = await calculate_chart(birth_data)
    if not chart_result:
        await update.message.reply_text(
            "❌ *Horoscope calculation failed.*\n"
            "Please restart using /start and verify your input details.",
            parse_mode="Markdown"
        )
        return ConversationHandler.END

    context.user_data["chart_data"] = chart_result
    
    asc = chart_result["ascendant"]["sign"]
    moon = chart_result["moon_intelligence"]
    yogas = chart_result.get("yogas", [])
    yogas_text = ", ".join(f"*{y['name']}*" for y in yogas) if yogas else "None detected"
    
    summary_msg = (
        "🌌 **YOUR VEDIC HOROSCOPE SUMMARY** 🌌\n"
        "━━━━━━━━━━━━━━━━━━━━\n"
        f"📍 **Birth Place:** `{resolved_name}`\n"
        f"📅 **Date:** `{context.user_data['date']}` | **Time:** `{context.user_data['time']}`\n"
        "━━━━━━━━━━━━━━━━━━━━\n"
        f"🌅 **Ascendant (Lagna):** *{asc}*\n"
        f"🌙 **Moon Sign (Rashi):** *{moon['sign']}*\n"
        f"⭐ **Nakshatra:** *{moon['nakshatra']}* (Pada {moon['pada']})\n"
        f"💎 **Nakshatra Strength:** *{moon['strength']}*\n"
        f"🌀 **Yogas:** {yogas_text}\n"
        "━━━━━━━━━━━━━━━━━━━━\n"
        "What would you like to do next? Choose an option below:"
    )
    
    keyboard = [
        [
            InlineKeyboardButton("📜 Generate Full Report", callback_data="btn_report"),
            InlineKeyboardButton("💬 Chat with AI RISHI", callback_data="btn_chat")
        ],
        [
            InlineKeyboardButton("🔄 Start Over", callback_data="btn_restart")
        ]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(summary_msg, reply_markup=reply_markup, parse_mode="Markdown")
    return ConversationHandler.END


# ----------------- Callback Query Handlers (Button Presses) -----------------

async def button_click(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handles button selections from the inline keyboard."""
    query = update.callback_query
    await query.answer()
    
    action = query.data
    chart_data = context.user_data.get("chart_data")
    
    if not chart_data:
        await query.edit_message_text("⚠️ Session expired. Please start over using /start.")
        return ConversationHandler.END

    if action == "btn_report":
        await query.edit_message_text("⌛ *Generating your detailed 1-2 page Vedic report...*\n_(This can take up to 30 seconds. Please hold on!)_", parse_mode="Markdown")
        report = await generate_full_report(chart_data)
        
        if len(report) > 4000:
            # Split on paragraph boundaries to avoid breaking Markdown mid-tag
            parts = _split_text_safely(report, 4000)
            for i, part in enumerate(parts):
                if i == 0:
                    await safe_reply_markdown(query, part, is_edit=True)
                else:
                    await safe_reply_markdown(query.message, part)
        else:
            await safe_reply_markdown(query, report, is_edit=True)
            
        keyboard = [[InlineKeyboardButton("💬 Chat with AI RISHI", callback_data="btn_chat"),
                     InlineKeyboardButton("🔄 Restart", callback_data="btn_restart")]]
        await query.message.reply_text("Report complete! You can now chat with AI RISHI about your chart:", reply_markup=InlineKeyboardMarkup(keyboard))
        
    elif action == "btn_chat":
        await query.edit_message_text(
            "🔮 **Entering Consultation Room** 🔮\n\n"
            "You are now chatting with expert AI RISHI who has access to your full birth chart.\n"
            "Ask any questions regarding your career, love, health, wealth, or current running periods.\n\n"
            "💬 *Go ahead, ask your first question:* (Type /exit to leave the chat)",
            parse_mode="Markdown"
        )
        context.user_data["chat_history"] = []
        return STATE_CHAT
        
    elif action == "btn_restart":
        await query.edit_message_text("Let's start over! Enter your **Date of Birth** (DD/MM/YYYY):", parse_mode="Markdown")
        return STATE_DATE

    return ConversationHandler.END


# ----------------- Chat Mode Handler -----------------

async def handle_chat_question(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handles persistent conversation with AI RISHI."""
    question = update.message.text.strip()
    
    if question.lower() == "/exit":
        await update.message.reply_text(
            "🌌 *Thank you for consulting AI RISHI.* \n"
            "Your chat session has ended. Use /start to draw another horoscope!",
            parse_mode="Markdown"
        )
        return ConversationHandler.END

    # Enforce max input length to prevent abuse
    if len(question) > MAX_INPUT_LENGTH:
        await update.message.reply_text(
            f"⚠️ *Message too long.*\nPlease keep your question under {MAX_INPUT_LENGTH} characters.",
            parse_mode="Markdown"
        )
        return STATE_CHAT
        
    chart_data = context.user_data.get("chart_data")
    if not chart_data:
        await update.message.reply_text("⚠️ Session expired. Please start over using /start.")
        return ConversationHandler.END

    history = context.user_data.get("chat_history", [])
    # Count only user messages (every other entry) for the question limit
    user_question_count = sum(1 for msg in history if msg.get("role") == "user")
    if user_question_count >= 3:
        await update.message.reply_text(
            "⚠️ *Limit Reached*\n"
            "You have reached the limit of 3 questions per session in the free tier.\n"
            "Please generate the full report for deeper analysis, or type `/exit` to close the consultation.",
            parse_mode="Markdown"
        )
        return STATE_CHAT

    await update.message.reply_chat_action(action="typing")
    
    astrologer_reply = await chat_with_astrologer(chart_data, question, history)
    
    history.append({"role": "user", "text": question})
    history.append({"role": "model", "text": astrologer_reply})
    context.user_data["chat_history"] = history
    
    remaining = 3 - sum(1 for msg in history if msg.get("role") == "user")
    
    await safe_reply_markdown(update.message, astrologer_reply)
    if remaining > 0:
        await update.message.reply_text(f"💡 _Ask another question ({remaining} remaining) or type `/exit` to end consultation._", parse_mode="Markdown")
    else:
        await update.message.reply_text(
            "⚠️ *You have used all 3 free questions.*\n"
            "Type `/exit` to end the consultation, or generate a full report for deeper analysis.",
            parse_mode="Markdown"
        )
    return STATE_CHAT

async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Cancels and ends the conversation."""
    await update.message.reply_text("Consultation closed. Type /start to begin a new calculation.")
    return ConversationHandler.END


# We will declare application globally or load it inside startup
bot_app = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Modern lifespan context manager for FastAPI startup/shutdown."""
    # Startup
    asyncio.create_task(run_bot_in_background())
    yield
    # Shutdown
    if bot_app:
        logger.info("Stopping Telegram Bot...")
        if bot_app.updater and bot_app.updater.running:
            await bot_app.updater.stop()
        await bot_app.stop()
        await bot_app.shutdown()

# Create FastAPI application with lifespan
app = FastAPI(title="Telegram AI Rishi Webhook Interface", lifespan=lifespan)

@app.get("/")
def health_check():
    if not TELEGRAM_BOT_TOKEN:
        return {"status": "warning", "message": "API web server is running, but TELEGRAM_BOT_TOKEN is missing in environment secrets!"}
    render_url = os.getenv("RENDER_EXTERNAL_URL")
    return {
        "status": "healthy",
        "service": "Vedic Astrology Telegram Bot",
        "mode": "webhook" if render_url else "polling",
    }

@app.post("/telegram-webhook")
async def telegram_webhook(request: Request):
    global bot_app
    if not bot_app:
        raise HTTPException(status_code=503, detail="Service unavailable")

    # Validate the webhook secret token from Telegram
    token_header = request.headers.get("X-Telegram-Bot-Api-Secret-Token", "")
    if not secrets.compare_digest(token_header, WEBHOOK_SECRET):
        logger.warning("Webhook request rejected: invalid secret token")
        raise HTTPException(status_code=403, detail="Forbidden")

    try:
        data = await request.json()
        update = Update.de_json(data, bot_app.bot)
        await bot_app.process_update(update)
        return {"status": "ok"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing webhook update: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def run_bot_in_background():
    global bot_app
    if not TELEGRAM_BOT_TOKEN:
        logger.warning("TELEGRAM_BOT_TOKEN is not configured. Telegram bot polling/webhook is disabled.")
        return

    if bot_app:
        render_url = os.getenv("RENDER_EXTERNAL_URL")
        
        # We must initialize and start the application manually since we run in the background
        await bot_app.initialize()
        await bot_app.start()

        if render_url:
            webhook_url = f"{render_url}/telegram-webhook"
            logger.info(f"Render environment detected. Setting Telegram Webhook to: {webhook_url}")
            # Clear any active webhook or polling session before setting a new one
            await bot_app.bot.delete_webhook()
            await bot_app.bot.set_webhook(
                url=webhook_url,
                allowed_updates=Update.ALL_TYPES,
                secret_token=WEBHOOK_SECRET
            )
        else:
            logger.info("Local environment detected. Using Telegram Polling...")
            await bot_app.bot.delete_webhook()
            # This will run polling non-blocking
            await bot_app.updater.start_polling(allowed_updates=Update.ALL_TYPES)
            while True:
                await asyncio.sleep(3600)

# ----------------- Bot Initialization -----------------

def main():
    """Starts the bot."""
    global bot_app
    
    if TELEGRAM_BOT_TOKEN:
        from telegram.request import HTTPXRequest

        # Set generous 30-second timeouts to handle cloud container network latency on boot
        request_config = HTTPXRequest(connect_timeout=30.0, read_timeout=30.0)

        # Build the Application
        bot_app = Application.builder().token(TELEGRAM_BOT_TOKEN).request(request_config).build()

        conv_handler = ConversationHandler(
            entry_points=[
                CommandHandler("start", start),
                CallbackQueryHandler(button_click, pattern="^btn_")
            ],
            states={
                STATE_DATE: [MessageHandler(filters.TEXT & ~filters.COMMAND, handle_date)],
                STATE_TIME: [MessageHandler(filters.TEXT & ~filters.COMMAND, handle_time)],
                STATE_CITY: [MessageHandler(filters.TEXT & ~filters.COMMAND, handle_city)],
                STATE_CHAT: [
                    MessageHandler(filters.TEXT & ~filters.COMMAND, handle_chat_question),
                    CommandHandler("exit", cancel),
                ],
            },
            fallbacks=[
                CommandHandler("exit", cancel),
                CommandHandler("cancel", cancel),
                CommandHandler("start", start),
            ],
            per_message=False,
        )

        # IMPORTANT: Only register the ConversationHandler.
        # Do NOT register duplicate standalone handlers — they intercept callbacks
        # before the ConversationHandler can transition states (e.g. to STATE_CHAT),
        # which was the root cause of "first question treated as answer" bug.
        bot_app.add_handler(conv_handler)
    else:
        logger.warning("TELEGRAM_BOT_TOKEN is missing. Bot polling initialization skipped.")

    # Render injects the port it wants us to listen to inside the PORT env variable
    port = int(os.getenv("PORT", "8000"))
    logger.info(f"Starting FastAPI web server on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)

if __name__ == "__main__":
    main()
