import os
import swisseph as swe
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import pytz
import google.generativeai as genai
from dotenv import load_dotenv
import logging

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator

# --- Auto-Location ---
from geopy.geocoders import Nominatim
from timezonefinder import TimezoneFinder

# --- 1. Configuration & Logging ---
load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000") # Security Lock
MAX_QUESTIONS = int(os.getenv("MAX_QUESTIONS", 3))

# --- 2. Robust AI Initialization (From your snippet) ---
ai_model = None

if not GEMINI_API_KEY:
    logger.error("CRITICAL: GEMINI_API_KEY is missing.")
else:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        # Attempt to load model
        candidate_model = genai.GenerativeModel(GEMINI_MODEL_NAME)
        
        # Health Check: Dry run a simple token count or generation
        try:
            # We just check if the object is valid, genuine connection happens on first call
            # or we can try a dummy generate if we want to be 100% sure:
            # candidate_model.generate_content("ping") 
            ai_model = candidate_model
            logger.info(f"Gemini Model '{GEMINI_MODEL_NAME}' loaded successfully.")
        except Exception as health_e:
            logger.warning(f"Gemini loaded but failed health check: {health_e}")
            ai_model = None
            
    except Exception as e:
        logger.error(f"Failed to configure Gemini: {e}")

# --- 3. FastAPI Setup ---
app = FastAPI(
    title="Vedic Astrology API (Secure)", 
    version="18.0.0",
    openapi_url="/openapi.json"
)

# --- 4. CORS Security (Only Specific Frontend) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL], # <--- LOCKED DOWN
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"], # Only allow necessary methods
    allow_headers=["*"],
)

# --- 5. Swiss Ephemeris Setup ---
EPHEMERIS_PATH = os.path.join(os.path.dirname(__file__), 'ephe')
swe.set_ephe_path(EPHEMERIS_PATH)
PLANET_FLAGS = swe.FLG_SIDEREAL
HOUSE_FLAGS = swe.FLG_SIDEREAL
SIDEREAL_YEAR = 365.256363004

SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]
DASHA_SEQ = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"]
DASHA_YEARS = { "Ketu": 7, "Venus": 20, "Sun": 6, "Moon": 10, "Mars": 7, "Rahu": 18, "Jupiter": 16, "Saturn": 19, "Mercury": 17 }

NAKSHATRA_NAMES = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha",
    "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
    "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
]

PLANET_MAPPING = {
    "Sun": swe.SUN, "Moon": swe.MOON, "Mars": swe.MARS, "Mercury": swe.MERCURY,
    "Jupiter": swe.JUPITER, "Venus": swe.VENUS, "Saturn": swe.SATURN, "Rahu": swe.MEAN_NODE
}

FUNCTIONAL_MALEFICS = {
    0: ["Mercury", "Saturn", "Rahu", "Ketu"], 1: ["Venus", "Jupiter", "Moon", "Rahu", "Ketu"],
    2: ["Mars", "Jupiter", "Sun", "Rahu", "Ketu"], 3: ["Jupiter", "Saturn", "Mercury", "Rahu", "Ketu"],
    4: ["Mercury", "Venus", "Saturn", "Rahu", "Ketu"], 5: ["Mars", "Jupiter", "Moon", "Rahu", "Ketu"],
    6: ["Mars", "Jupiter", "Sun", "Rahu", "Ketu"], 7: ["Venus", "Mercury", "Saturn", "Rahu", "Ketu"],
    8: ["Venus", "Saturn", "Mercury", "Rahu", "Ketu"], 9: ["Mars", "Jupiter", "Moon", "Rahu", "Ketu"],
    10: ["Moon", "Mercury", "Mars", "Rahu", "Ketu"], 11: ["Sun", "Venus", "Saturn", "Rahu", "Ketu"]
}

STRENGTH_CHART = {
    "Sun": {"exalt": "Aries", "debilit": "Libra", "own": ["Leo"]},
    "Moon": {"exalt": "Taurus", "debilit": "Scorpio", "own": ["Cancer"]},
    "Mars": {"exalt": "Capricorn", "debilit": "Cancer", "own": ["Aries", "Scorpio"]},
    "Mercury": {"exalt": "Virgo", "debilit": "Pisces", "own": ["Gemini", "Virgo"]},
    "Jupiter": {"exalt": "Cancer", "debilit": "Capricorn", "own": ["Sagittarius", "Pisces"]},
    "Venus": {"exalt": "Pisces", "debilit": "Virgo", "own": ["Taurus", "Libra"]},
    "Saturn": {"exalt": "Libra", "debilit": "Aries", "own": ["Capricorn", "Aquarius"]},
    "Rahu": {"exalt": "Taurus", "debilit": "Scorpio", "own": ["Aquarius"]},
    "Ketu": {"exalt": "Scorpio", "debilit": "Taurus", "own": ["Scorpio"]}
}

# --- Pydantic Models ---

class BirthData(BaseModel):
    date: str
    time: str
    city: Optional[str] = None 
    lat: Optional[float] = None
    lon: Optional[float] = None
    timezone: Optional[float] = None

    @field_validator('city')
    def clean_city(cls, v):
        return v.strip().title() if v else v

    @field_validator('date')
    def validate_date(cls, v):
        v = v.replace('-', '/')
        try:
            datetime.strptime(v, "%d/%m/%Y")
            return v
        except ValueError:
            raise ValueError("Invalid date format. Please use DD/MM/YYYY")

    @field_validator('time')
    def validate_time(cls, v):
        try:
            parts = v.split(':')
            if len(parts) == 2:
                h, m = int(parts[0]), int(parts[1])
                return f"{h:02d}:{m:02d}"
            return v
        except:
            raise ValueError("Invalid time format. Please use HH:MM")

class ChatMessage(BaseModel):
    role: str
    text: str

class ChatRequest(BaseModel):
    chart_data: Dict[str, Any]
    question: str
    history: List[ChatMessage] = []

geolocator = Nominatim(user_agent="vedic_astro_secure", timeout=10)
tf = TimezoneFinder()

# --- Endpoints ---

@app.get("/search_city")
def search_city(query: str = Query(..., min_length=3)):
    try:
        locations = geolocator.geocode(query, exactly_one=False, limit=5, language='en')
        if not locations: return []
        return [{"name": loc.address, "lat": loc.latitude, "lon": loc.longitude} for loc in locations]
    except Exception as e:
        logger.error(f"Geo Error: {e}")
        return []

def get_location_and_jd(data: BirthData):
    lat, lon, tz = data.lat, data.lon, data.timezone

    if data.city and (not lat or lat == 0 or not lon or lon == 0):
        try:
            loc = geolocator.geocode(data.city)
            if not loc: raise HTTPException(404, detail="City not found")
            lat, lon = loc.latitude, loc.longitude
        except Exception:
            raise HTTPException(500, detail="Geocoding unavailable")
    
    if lat is None or lon is None: raise HTTPException(400, detail="Need City or Lat/Lon")

    if tz is None or tz == 0:
        try:
            tz_str = tf.timezone_at(lng=lon, lat=lat) or "UTC"
            local_tz = pytz.timezone(tz_str)
            dt_obj = datetime.strptime(f"{data.date} {data.time}", "%d/%m/%Y %H:%M")
            tz = local_tz.localize(dt_obj).utcoffset().total_seconds() / 3600.0
        except:
            tz = 0.0

    t_str = data.time + ":00"
    dt_str = f"{data.date} {t_str}"
    local_dt = datetime.strptime(dt_str, "%d/%m/%Y %H:%M:%S")
    utc_dt = local_dt - timedelta(hours=tz)
    utc_hour = utc_dt.hour + (utc_dt.minute/60.0) + (utc_dt.second/3600.0)
    jd = swe.julday(utc_dt.year, utc_dt.month, utc_dt.day, utc_hour)
    
    return jd, local_dt, lat, lon, tz

def get_nakshatra(deg):
    span = 13.333333333
    idx = int(deg / span)
    deg_in_nak = deg % span
    pada = int(deg_in_nak / (span / 4)) + 1
    return {
        "name": NAKSHATRA_NAMES[idx % 27],
        "lord": DASHA_SEQ[idx % 9],
        "pada": pada,
        "fraction": deg_in_nak / span
    }

def get_dignity(planet_name, sign_name, asc_idx):
    status = "Neutral"
    if planet_name in STRENGTH_CHART:
        r = STRENGTH_CHART[planet_name]
        if sign_name == r["exalt"]: status = "Exalted"
        elif sign_name == r["debilit"]: status = "Debilitated"
        elif sign_name in r["own"]: status = "Own Sign"
    is_malefic = planet_name in FUNCTIONAL_MALEFICS.get(asc_idx, [])
    nature = "Functional Malefic" if is_malefic else "Functional Benefic"
    if planet_name in ["Rahu", "Ketu"]: nature = "Natural Malefic"
    return status, nature

class VimshottariTimeline:
    def __init__(self, moon_deg, birth_date):
        self.nak = get_nakshatra(moon_deg)
        self.birth_date = birth_date
        
    def add_time(self, dt, years):
        return dt + timedelta(days=years * SIDEREAL_YEAR)
        
    def generate(self):
        total_yrs = DASHA_YEARS[self.nak['lord']]
        passed_fraction = self.nak['fraction']
        passed_years = total_yrs * passed_fraction
        theoretical_start = self.add_time(self.birth_date, -passed_years)
        timeline = []
        curr_maha_start = theoretical_start
        start_idx = DASHA_SEQ.index(self.nak['lord'])
        
        for i in range(12):
            m_lord = DASHA_SEQ[(start_idx + i) % 9]
            m_duration = DASHA_YEARS[m_lord]
            m_end = self.add_time(curr_maha_start, m_duration)
            if m_end < self.birth_date:
                curr_maha_start = m_end
                continue
            antardashas = []
            curr_antar = curr_maha_start
            sub_idx = DASHA_SEQ.index(m_lord)
            for j in range(9):
                a_lord = DASHA_SEQ[(sub_idx + j) % 9]
                a_dur = (m_duration * DASHA_YEARS[a_lord]) / 120.0
                a_end = self.add_time(curr_antar, a_dur)
                if a_end > self.birth_date:
                    antardashas.append({
                        "lord": a_lord,
                        "start": max(self.birth_date, curr_antar).strftime("%d-%m-%Y"),
                        "end": a_end.strftime("%d-%m-%Y")
                    })
                curr_antar = a_end
            timeline.append({
                "lord": m_lord,
                "start": max(self.birth_date, curr_maha_start).strftime("%d-%m-%Y"),
                "end": m_end.strftime("%d-%m-%Y"),
                "antardashas": antardashas
            })
            curr_maha_start = m_end
            if curr_maha_start.year > (self.birth_date.year + 110): break
        return timeline

@app.post("/calculate_chart")
def calculate_chart(data: BirthData):
    try:
        jd, local_dt, lat, lon, tz = get_location_and_jd(data)
        swe.set_sid_mode(swe.SIDM_LAHIRI)
        
        cusps, ascmc = swe.houses_ex(jd, lat, lon, b'A', flags=HOUSE_FLAGS)
        asc_deg = ascmc[0]
        asc_idx = int(asc_deg / 30)
        
        planets = []
        for name, pid in PLANET_MAPPING.items():
            xx, _ = swe.calc_ut(jd, pid, PLANET_FLAGS)
            lon_deg = xx[0]
            sign_name = SIGNS[int(lon_deg / 30)]
            house = ((int(lon_deg/30) - asc_idx + 12) % 12) + 1
            nak = get_nakshatra(lon_deg)
            strength, nature = get_dignity(name, sign_name, asc_idx)
            planets.append({
                "name": name, "sign": sign_name, "house": house,
                "strength": strength, "nature": nature,
                "nakshatra": nak["name"], "nakshatra_lord": nak["lord"], "nakshatra_pada": nak["pada"],
                "full_degree": lon_deg
            })

        rahu = next(p for p in planets if p["name"] == "Rahu")
        ketu_deg = (rahu["full_degree"] + 180) % 360
        ketu_sign = SIGNS[int(ketu_deg / 30)]
        k_str, k_nat = get_dignity("Ketu", ketu_sign, asc_idx)
        k_nak = get_nakshatra(ketu_deg)
        planets.append({
            "name": "Ketu", "sign": ketu_sign, "house": ((int(ketu_deg/30) - asc_idx + 12) % 12) + 1,
            "strength": k_str, "nature": k_nat,
            "nakshatra": k_nak["name"], "nakshatra_lord": k_nak["lord"], "nakshatra_pada": k_nak["pada"],
            "full_degree": ketu_deg
        })

        moon = next(p for p in planets if p["name"] == "Moon")
        timeline = VimshottariTimeline(moon["full_degree"], local_dt).generate()

        chart = {}
        for h in range(1, 13):
            sign_nm = SIGNS[(asc_idx + h - 1) % 12]
            pls = [p for p in planets if p["house"] == h]
            chart[f"house_{h}"] = { "sign": sign_nm, "planets": pls }

        return {
            "location": { "city": data.city, "lat": lat, "lon": lon, "tz": tz },
            "ascendant": { "sign": SIGNS[asc_idx], "degree": asc_deg },
            "moon_intelligence": { "nakshatra": moon["nakshatra"], "pada": moon["nakshatra_pada"], "sign": moon["sign"], "strength": moon["strength"] },
            "vimshottari_timeline": timeline,
            "chart_data": chart
        }
    except Exception as e:
        logger.error(f"Calc Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat_with_astrologer")
def chat_with_astrologer(request: ChatRequest):
    if not ai_model:
        raise HTTPException(status_code=503, detail="AI Service is currently unavailable. Please check API Key.")

    try:
        if len(request.history) >= (MAX_QUESTIONS * 2):
            return { "response": "I apologize, the question limit has been reached." }

        chart_context = f"""
        Chart:
        Ascendant: {request.chart_data['ascendant']['sign']}
        Moon: {request.chart_data['moon_intelligence']['sign']} ({request.chart_data['moon_intelligence']['nakshatra']})
        Current Dasha: {request.chart_data['vimshottari_timeline'][0]['lord']}
        Planets: {str(request.chart_data['chart_data'])}
        """
        
        sys_prompt = """
        You are an expert Vedic Astrologer. 
        Analyze the chart.
        FORMATTING RULES:
        1. Use **Bold** for Planet Names and Key Terms.
        2. Use bullet points for lists.
        3. Keep paragraphs short.
        """
        
        gemini_history = [{"role": "user", "parts": [f"{sys_prompt}\n\n{chart_context}"]}, {"role": "model", "parts": ["Understood."]}]
        for msg in request.history:
            gemini_history.append({"role": "user" if msg.role == "user" else "model", "parts": [msg.text]})

        chat = ai_model.start_chat(history=gemini_history)
        response = chat.send_message(request.question)
        return {"response": response.text}

    except Exception as e:
        logger.error(f"Chat Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)