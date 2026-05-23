import subprocess
import sys
import time

print("🪐 --- Starting Vedic Jyotish Unified Launcher --- 🪐", flush=True)

# 1. Start the Telegram Bot in a separate background process
print("🤖 Starting Telegram Bot process...", flush=True)
bot_process = subprocess.Popen([sys.executable, "telegram_bot.py"])

# 2. Start the FastAPI backend on Hugging Face port 7860
print("⚡ Starting FastAPI Backend server...", flush=True)
backend_process = subprocess.Popen([
    sys.executable, "-m", "uvicorn", "main:app",
    "--host", "0.0.0.0",
    "--port", "7860",
    "--workers", "2",
    "--timeout-keep-alive", "30"
])

try:
    # Monitor both processes
    while True:
        # Check if either process has terminated
        bot_status = bot_process.poll()
        backend_status = backend_process.poll()
        
        # If Telegram bot exits, restart it
        if bot_status is not None:
            print(f"⚠️ Telegram Bot process terminated with exit code {bot_status}. Restarting bot...", flush=True)
            bot_process = subprocess.Popen([sys.executable, "telegram_bot.py"])
            
        # If FastAPI backend exits, the whole container must shut down so Hugging Face restarts it
        if backend_status is not None:
            print(f"❌ FastAPI Backend terminated with exit code {backend_status}. Exiting container...", flush=True)
            bot_process.terminate()
            sys.exit(backend_status)
            
        time.sleep(5)
except KeyboardInterrupt:
    print("👋 Shutting down processes...", flush=True)
    bot_process.terminate()
    backend_process.terminate()
