import os
import asyncio
import swisseph as swe
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from functools import lru_cache
import pytz
from google import genai
from dotenv import load_dotenv
import logging
import traceback
import warnings

# Suppress harmless Pydantic warnings from the new google-genai SDK
warnings.filterwarnings("ignore", category=UserWarning, module="pydantic")

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from starlette.middleware.base import BaseHTTPMiddleware
from pydantic import BaseModel, field_validator, Field
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# --- Auto-Location ---
import json
import urllib.request
import urllib.parse
from timezonefinder import TimezoneFinder

PHOTON_API = "https://photon.komoot.io/api/"

# --- 1. Configuration & Logging ---
load_dotenv()
ENVIRONMENT = os.getenv("ENVIRONMENT", "production") # Default to production to hide openapi on HF spaces
IS_PRODUCTION = ENVIRONMENT == "production"

if IS_PRODUCTION:
    logging.basicConfig(level=logging.WARNING) # Reduce noise and secure PII on public spaces like Hugging Face
else:
    logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
MAX_QUESTIONS = int(os.getenv("MAX_QUESTIONS", "3"))

# Build allowed origins list (support comma-separated for multiple frontends)
ALLOWED_ORIGINS = [u.strip() for u in FRONTEND_URL.split(",") if u.strip()]

# --- 2. Robust AI Initialization (From your snippet) ---
ai_model = None

if not GEMINI_API_KEY:
    logger.error("CRITICAL: GEMINI_API_KEY is missing.")
else:
    try:
        # Initialize the new Google GenAI client
        client = genai.Client(api_key=GEMINI_API_KEY)
        
        try:
            ai_model = client
            logger.info(f"Gemini Client loaded successfully for model '{GEMINI_MODEL_NAME}'.")
        except Exception as health_e:
            logger.warning(f"Gemini loaded but failed health check: {health_e}")
            ai_model = None
            
    except Exception as e:
        logger.error(f"Failed to configure Gemini: {e}")

# --- 3. FastAPI Setup & Proxy Rate Limiting ---
def get_real_ip(request: Request) -> str:
    """Extracts real user IP behind HF Spaces reverse proxy."""
    if "x-forwarded-for" in request.headers:
        return request.headers["x-forwarded-for"].split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"

limiter = Limiter(key_func=get_real_ip)
app = FastAPI(
    title="Vedic Astrology API",
    version="19.0.0",
    # Disable docs/openapi in production
    openapi_url=None if IS_PRODUCTION else "/openapi.json",
    docs_url=None if IS_PRODUCTION else "/docs",
    redoc_url=None if IS_PRODUCTION else "/redoc",
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# --- 4. Security Headers Middleware ---
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        if IS_PRODUCTION:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# --- 5. CORS Security (Locked to allowed origins) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
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

# --- Moolatrikona Signs (degree ranges within the sign) ---
MOOLATRIKONA = {
    "Sun": ("Leo", 0, 20),
    "Moon": ("Taurus", 4, 20),
    "Mars": ("Aries", 0, 12),
    "Mercury": ("Virgo", 16, 20),
    "Jupiter": ("Sagittarius", 0, 10),
    "Venus": ("Libra", 0, 15),
    "Saturn": ("Aquarius", 0, 20),
}

# --- Combustion Ranges (degrees from Sun) ---
COMBUSTION_DEGREES = {
    "Moon": 12, "Mars": 17, "Mercury": 14, "Jupiter": 11, "Venus": 10, "Saturn": 15
}

# --- Navamsa: Element-based seed signs (Traditional Parasara) ---
FIRE_SIGNS = [0, 4, 8]    # Aries, Leo, Sagittarius
WATER_SIGNS = [3, 7, 11]   # Cancer, Scorpio, Pisces
AIR_SIGNS = [2, 6, 10]     # Gemini, Libra, Aquarius
EARTH_SIGNS = [1, 5, 9]    # Taurus, Virgo, Capricorn
NAVAMSA_SEEDS = {"fire": 0, "water": 3, "air": 6, "earth": 9}  # Ar, Cn, Li, Cp

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
        v = v.strip().replace('-', '/').replace('.', '/')
        try:
            dt = datetime.strptime(v, "%d/%m/%Y")
            if not (1900 <= dt.year <= datetime.now().year):
                raise ValueError(f"Birth year must be between 1900 and {datetime.now().year}")
            if dt > datetime.now():
                raise ValueError("Birth date cannot be in the future")
            return v
        except ValueError as e:
            if "does not match" in str(e) or "unconverted" in str(e):
                raise ValueError("Invalid date. Please use DD/MM/YYYY format (e.g. 08/09/2000)")
            raise

    @field_validator('time')
    def validate_time(cls, v):
        import re
        # Normalize common typos: semicolons, dots, spaces, commas, hyphens → colon
        cleaned = re.sub(r'[;., \-]', ':', v.strip())
        # Remove any characters that are not digits or colons
        cleaned = re.sub(r'[^0-9:]', '', cleaned)
        parts = cleaned.split(':')
        try:
            if len(parts) < 2:
                raise ValueError()
            h, m = int(parts[0]), int(parts[1])
            if not (0 <= h <= 23 and 0 <= m <= 59):
                raise ValueError()
            return f"{h:02d}:{m:02d}"
        except (ValueError, IndexError):
            raise ValueError(
                f"Invalid time '{v}'. Please use HH:MM format (e.g. 17:45). "
                "Make sure to use a colon (:) and not a semicolon (;)"
            )

class ChatMessage(BaseModel):
    role: str
    text: str

class ChatRequest(BaseModel):
    chart_data: Dict[str, Any]
    question: str = Field(..., min_length=1, max_length=500)
    history: List[ChatMessage] = []

tf = TimezoneFinder()

# --- Endpoints ---

@app.get("/")
def read_root():
    return {
        "message": "Vedic Astrology API is running",
        "status": "online",
        "documentation": "https://github.com/Dhruvil-8/VedicJyotish",
        "environment": ENVIRONMENT
    }

@lru_cache(maxsize=256)
def _geocode_query(query: str):
    """Cached geocoding via Photon API — fast, no rate limits, no geopy dependency."""
    try:
        params = urllib.parse.urlencode({"q": query, "limit": 5, "lang": "en"})
        url = f"{PHOTON_API}?{params}"
        req = urllib.request.Request(url, headers={"User-Agent": "VedicJyotish/1.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
        results = []
        for f in data.get("features", []):
            props = f.get("properties", {})
            coords = f.get("geometry", {}).get("coordinates", [0, 0])
            parts = [props.get("name", "")]
            if props.get("city") and props.get("city") != props.get("name"):
                parts.append(props["city"])
            if props.get("state"):
                parts.append(props["state"])
            if props.get("country"):
                parts.append(props["country"])
            address = ", ".join(p for p in parts if p)
            results.append({"name": address, "lat": coords[1], "lon": coords[0]})
        return results
    except Exception as e:
        logger.error(f"Photon Geo Error: {e}")
        return []

@app.get("/search_city")
@limiter.limit("15/minute")
async def search_city(request: Request, query: str = Query(..., min_length=3, max_length=100)):
    try:
        return await asyncio.to_thread(_geocode_query, query)
    except Exception as e:
        logger.error(f"Geo Error: {e}")
        return []

def get_location_and_jd(data: BirthData):
    lat, lon, tz = data.lat, data.lon, data.timezone

    if data.city and (not lat or lat == 0 or not lon or lon == 0):
        try:
            results = _geocode_query(data.city)
            if not results: raise HTTPException(404, detail="City not found")
            lat, lon = results[0]["lat"], results[0]["lon"]
        except HTTPException:
            raise
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

    # Final defensive sanitization before strptime (belt-and-suspenders)
    import re
    safe_time = re.sub(r'[^0-9:]', ':', data.time)  # replace any non-digit/colon char
    t_str = safe_time + ":00"
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

def get_dignity(planet_name, sign_name, deg_in_sign, asc_idx):
    """Enhanced dignity with Moolatrikona support."""
    status = "Neutral"
    if planet_name in STRENGTH_CHART:
        r = STRENGTH_CHART[planet_name]
        if sign_name == r["exalt"]: status = "Exalted"
        elif sign_name == r["debilit"]: status = "Debilitated"
        elif sign_name in r["own"]: status = "Own Sign"
    # Moolatrikona overrides Own Sign if within degree range
    if planet_name in MOOLATRIKONA:
        mt_sign, mt_start, mt_end = MOOLATRIKONA[planet_name]
        if sign_name == mt_sign and mt_start <= deg_in_sign <= mt_end:
            status = "Moolatrikona"
    is_malefic = planet_name in FUNCTIONAL_MALEFICS.get(asc_idx, [])
    nature = "Functional Malefic" if is_malefic else "Functional Benefic"
    if planet_name in ["Rahu", "Ketu"]: nature = "Natural Malefic"
    return status, nature

def check_retrograde(speed):
    """Planet is retrograde if its longitudinal speed is negative."""
    return speed < 0

def check_combustion(planet_name, planet_deg, sun_deg):
    """Check if planet is combust (too close to Sun)."""
    if planet_name not in COMBUSTION_DEGREES:
        return False
    diff = abs(planet_deg - sun_deg)
    if diff > 180:
        diff = 360 - diff
    return diff <= COMBUSTION_DEGREES[planet_name]

def get_navamsa_sign(sign_idx, degree_in_sign):
    """Calculate Navamsa (D9) sign using Traditional Parasara method.
    Fire signs count from Aries, Water from Cancer, Air from Libra, Earth from Capricorn.
    """
    dvf = 9
    f1 = 30.0 / dvf  # 3.333...
    pada = int(degree_in_sign // f1)  # 0-8
    if sign_idx in FIRE_SIGNS:
        seed = NAVAMSA_SEEDS["fire"]
    elif sign_idx in WATER_SIGNS:
        seed = NAVAMSA_SEEDS["water"]
    elif sign_idx in AIR_SIGNS:
        seed = NAVAMSA_SEEDS["air"]
    else:
        seed = NAVAMSA_SEEDS["earth"]
    navamsa_rasi = (seed + pada) % 12
    return navamsa_rasi

def detect_yogas(planets, asc_idx):
    """Detect key Vedic yogas from planet positions."""
    yogas = []
    # Build planet-to-house lookup
    p_house = {p["name"]: p["house"] for p in planets}
    # Build house-to-planets lookup
    house_planets = {}
    for p in planets:
        house_planets.setdefault(p["house"], []).append(p["name"])

    # 1. Gaja Kesari Yoga: Jupiter in Kendra (1,4,7,10) from Moon
    if "Jupiter" in p_house and "Moon" in p_house:
        diff = ((p_house["Jupiter"] - p_house["Moon"]) % 12)
        if diff in [0, 3, 6, 9]:  # houses 1,4,7,10 from Moon
            yogas.append({
                "name": "Gaja Kesari Yoga",
                "description": "Jupiter in Kendra from Moon. Bestows wisdom, wealth, and fame.",
                "type": "benefic"
            })

    # 2. Budhaditya Yoga: Sun + Mercury in same house
    if "Sun" in p_house and "Mercury" in p_house:
        if p_house["Sun"] == p_house["Mercury"]:
            yogas.append({
                "name": "Budhaditya Yoga",
                "description": "Sun and Mercury conjoined. Gives sharp intellect and communication skills.",
                "type": "benefic"
            })

    # 3. Chandra Mangal Yoga: Moon + Mars in same house
    if "Moon" in p_house and "Mars" in p_house:
        if p_house["Moon"] == p_house["Mars"]:
            yogas.append({
                "name": "Chandra Mangal Yoga",
                "description": "Moon and Mars conjoined. Gives financial prosperity through courage.",
                "type": "benefic"
            })

    # 4. Panch Mahapurusha Yogas:
    # Planet must be in own/exalted sign AND in Kendra (1,4,7,10) from Lagna
    kendra_houses = [1, 4, 7, 10]
    mahapurusha = {
        "Mars": ("Ruchaka Yoga", "Mars in own/exalted sign in Kendra. Gives courage, strength, and leadership."),
        "Mercury": ("Bhadra Yoga", "Mercury in own/exalted sign in Kendra. Gives eloquence and intelligence."),
        "Jupiter": ("Hamsa Yoga", "Jupiter in own/exalted sign in Kendra. Gives spirituality and wisdom."),
        "Venus": ("Malavya Yoga", "Venus in own/exalted sign in Kendra. Gives luxury, beauty, and comfort."),
        "Saturn": ("Sasa Yoga", "Saturn in own/exalted sign in Kendra. Gives authority and discipline."),
    }
    for pname, (yoga_name, yoga_desc) in mahapurusha.items():
        p = next((x for x in planets if x["name"] == pname), None)
        if p and p["house"] in kendra_houses and p["strength"] in ["Exalted", "Own Sign", "Moolatrikona"]:
            yogas.append({"name": yoga_name, "description": yoga_desc, "type": "benefic"})

    # 5. Kemadruma Yoga: No planets in 2nd or 12th from Moon (negative yoga)
    if "Moon" in p_house:
        moon_h = p_house["Moon"]
        h2_from_moon = (moon_h % 12) + 1
        h12_from_moon = ((moon_h - 2) % 12) + 1
        planets_2nd = [p for p in house_planets.get(h2_from_moon, []) if p not in ["Moon", "Rahu", "Ketu"]]
        planets_12th = [p for p in house_planets.get(h12_from_moon, []) if p not in ["Moon", "Rahu", "Ketu"]]
        if not planets_2nd and not planets_12th:
            yogas.append({
                "name": "Kemadruma Yoga",
                "description": "No planets in 2nd or 12th from Moon. May indicate financial struggles or loneliness.",
                "type": "malefic"
            })

    return yogas

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
@limiter.limit("10/minute")
async def calculate_chart(request: Request, data: BirthData):
    return await asyncio.to_thread(_compute_chart, data)

def _compute_chart(data: BirthData):
    """Internal chart computation — no Request dependency."""
    try:
        jd, local_dt, lat, lon, tz = get_location_and_jd(data)
        swe.set_sid_mode(swe.SIDM_LAHIRI)
        
        cusps, ascmc = swe.houses_ex(jd, lat, lon, b'A', flags=HOUSE_FLAGS)
        asc_deg = ascmc[0]
        asc_idx = int(asc_deg / 30)
        
        planets = []
        sun_deg = None
        # First pass: get all planet positions
        raw_positions = []
        for name, pid in PLANET_MAPPING.items():
            xx, _ = swe.calc_ut(jd, pid, PLANET_FLAGS)
            lon_deg = xx[0]
            speed = xx[3] if len(xx) > 3 else 0
            raw_positions.append((name, pid, lon_deg, speed))
            if name == "Sun":
                sun_deg = lon_deg

        # Second pass: build planet data with enhanced dignity
        for name, pid, lon_deg, speed in raw_positions:
            sign_idx = int(lon_deg / 30)
            sign_name = SIGNS[sign_idx]
            deg_in_sign = lon_deg % 30
            house = ((sign_idx - asc_idx + 12) % 12) + 1
            nak = get_nakshatra(lon_deg)
            strength, nature = get_dignity(name, sign_name, deg_in_sign, asc_idx)
            is_retro = check_retrograde(speed) if name not in ["Sun", "Moon", "Rahu"] else False
            is_combust = check_combustion(name, lon_deg, sun_deg) if sun_deg is not None else False
            nav_sign_idx = get_navamsa_sign(sign_idx, deg_in_sign)
            planets.append({
                "name": name, "sign": sign_name, "house": house,
                "strength": strength, "nature": nature,
                "nakshatra": nak["name"], "nakshatra_lord": nak["lord"], "nakshatra_pada": nak["pada"],
                "full_degree": lon_deg, "deg_in_sign": round(deg_in_sign, 2),
                "retrograde": is_retro, "combust": is_combust,
                "navamsa_sign": SIGNS[nav_sign_idx]
            })

        # Add Ketu (180° from Rahu)
        rahu = next(p for p in planets if p["name"] == "Rahu")
        ketu_deg = (rahu["full_degree"] + 180) % 360
        ketu_sign_idx = int(ketu_deg / 30)
        ketu_sign = SIGNS[ketu_sign_idx]
        ketu_deg_in_sign = ketu_deg % 30
        k_str, k_nat = get_dignity("Ketu", ketu_sign, ketu_deg_in_sign, asc_idx)
        k_nak = get_nakshatra(ketu_deg)
        k_nav = get_navamsa_sign(ketu_sign_idx, ketu_deg_in_sign)
        planets.append({
            "name": "Ketu", "sign": ketu_sign, "house": ((ketu_sign_idx - asc_idx + 12) % 12) + 1,
            "strength": k_str, "nature": k_nat,
            "nakshatra": k_nak["name"], "nakshatra_lord": k_nak["lord"], "nakshatra_pada": k_nak["pada"],
            "full_degree": ketu_deg, "deg_in_sign": round(ketu_deg_in_sign, 2),
            "retrograde": True, "combust": False,
            "navamsa_sign": SIGNS[k_nav]
        })

        # Vimshottari Dasha
        moon = next(p for p in planets if p["name"] == "Moon")
        timeline = VimshottariTimeline(moon["full_degree"], local_dt).generate()

        # D1 Rasi Chart
        chart = {}
        for h in range(1, 13):
            sign_nm = SIGNS[(asc_idx + h - 1) % 12]
            pls = [p for p in planets if p["house"] == h]
            chart[f"house_{h}"] = { "sign": sign_nm, "planets": pls }

        # D9 Navamsa Chart
        nav_asc_sign_idx = get_navamsa_sign(asc_idx, asc_deg % 30)
        navamsa_chart = {}
        for h in range(1, 13):
            nav_sign_nm = SIGNS[(nav_asc_sign_idx + h - 1) % 12]
            nav_pls = [p["name"] for p in planets if p["navamsa_sign"] == nav_sign_nm]
            navamsa_chart[f"house_{h}"] = { "sign": nav_sign_nm, "planets": nav_pls }

        # Detect Yogas
        yogas = detect_yogas(planets, asc_idx)

        # Planetary Table (clean summary for frontend)
        planetary_table = [{
            "name": p["name"], "sign": p["sign"], "house": p["house"],
            "nakshatra": p["nakshatra"], "pada": p["nakshatra_pada"],
            "dignity": p["strength"], "retrograde": p["retrograde"],
            "combust": p["combust"], "navamsa_sign": p["navamsa_sign"]
        } for p in planets]

        return {
            "location": { "city": data.city, "lat": lat, "lon": lon, "tz": tz },
            "ascendant": { "sign": SIGNS[asc_idx], "degree": asc_deg },
            "moon_intelligence": { "nakshatra": moon["nakshatra"], "pada": moon["nakshatra_pada"], "sign": moon["sign"], "strength": moon["strength"] },
            "vimshottari_timeline": timeline,
            "chart_data": chart,
            "navamsa_chart": navamsa_chart,
            "planetary_table": planetary_table,
            "yogas": yogas
        }
    except Exception as e:
        logger.error(f"Calc Error: {e}")
        raise HTTPException(status_code=500, detail="Chart calculation failed. Please check your birth data." if IS_PRODUCTION else str(e))


@app.post("/generate_report")
@limiter.limit("5/minute")
async def generate_report_endpoint(request: Request, data: Dict[str, Any]):
    """Generate a comprehensive AI summary report from chart data."""
    if not ai_model:
        raise HTTPException(status_code=503, detail="AI Service is currently unavailable.")
    try:
        # data already contains the computed chart results from the frontend
        chart_result = data

        # --- Build comprehensive chart context for LLM ---
        # Find current Maha Dasha and Antardasha
        now_str = datetime.now().strftime("%d-%m-%Y")
        current_maha = "Unknown"
        current_antar = "Unknown"
        current_maha_dates = ""
        current_antar_dates = ""
        for md in chart_result.get('vimshottari_timeline', []):
            md_start = datetime.strptime(md['start'], "%d-%m-%Y")
            md_end = datetime.strptime(md['end'], "%d-%m-%Y")
            if md_start <= datetime.now() <= md_end:
                current_maha = md['lord']
                current_maha_dates = f"{md['start']} to {md['end']}"
                for ad in md.get('antardashas', []):
                    ad_start = datetime.strptime(ad['start'], "%d-%m-%Y")
                    ad_end = datetime.strptime(ad['end'], "%d-%m-%Y")
                    if ad_start <= datetime.now() <= ad_end:
                        current_antar = ad['lord']
                        current_antar_dates = f"{ad['start']} to {ad['end']}"
                        break
                break

        # Planetary positions with full detail
        planet_lines = []
        for p in chart_result['planetary_table']:
            flags = []
            if p.get('retrograde'): flags.append('Retrograde')
            if p.get('combust'): flags.append('Combust')
            flag_str = f" [{', '.join(flags)}]" if flags else ""
            planet_lines.append(
                f"  {p['name']}: {p['sign']} (House {p['house']}, {p['dignity']}, "
                f"Nakshatra: {p['nakshatra']} Pada {p['pada']}, "
                f"Navamsa: {p['navamsa_sign']}{flag_str})"
            )

        # Navamsa chart summary
        navamsa_lines = []
        for h in range(1, 13):
            hkey = f"house_{h}"
            hdata = chart_result['navamsa_chart'].get(hkey, {})
            planets_in = ', '.join(hdata.get('planets', [])) or 'Empty'
            navamsa_lines.append(f"  House {h} ({hdata.get('sign', '?')}): {planets_in}")

        # Yogas detail
        yoga_lines = []
        for y in chart_result.get('yogas', []):
            yoga_lines.append(f"  {y['name']} ({y['type']}): {y['description']}")
        yoga_str = chr(10).join(yoga_lines) if yoga_lines else "  None detected"

        chart_context = f"""COMPLETE BIRTH CHART ANALYSIS DATA:

Ascendant: {chart_result['ascendant']['sign']} ({chart_result['ascendant']['degree']:.2f}°)
Moon: {chart_result['moon_intelligence']['sign']} in {chart_result['moon_intelligence']['nakshatra']} Pada {chart_result['moon_intelligence']['pada']} ({chart_result['moon_intelligence']['strength']})

Current Running Period:
  Maha Dasha: {current_maha} ({current_maha_dates})
  Antar Dasha: {current_antar} ({current_antar_dates})

Planetary Positions (D1 Rasi):
{chr(10).join(planet_lines)}

Navamsa Chart (D9):
  Navamsa Lagna: {chart_result['navamsa_chart']['house_1']['sign']}
{chr(10).join(navamsa_lines)}

Yogas Detected:
{yoga_str}
"""

        report_prompt = f"""You are an AI-powered Vedic Astrology analysis engine. Analyze this birth chart data and create a comprehensive, well-structured 1-2 page report referencing EVERY piece of data provided.

CRITICAL RULES:
- Do NOT include any introductory preamble, greetings, or flowery opening paragraphs
- Do NOT include placeholders like "[Client Name]" or "[Your Name]"
- Do NOT roleplay or claim years of experience
- Do NOT include a "Date of Analysis" header
- Start DIRECTLY with the first analysis section heading

{chart_context}

REPORT STRUCTURE (cover ALL sections in detail):

## 1. Ascendant & Personality Profile
- Analyze the Ascendant sign, its lord, and where the lord is placed
- Discuss the Navamsa Lagna and how it modifies the personality
- Include Moon sign and Nakshatra influence on the mind and emotions

## 2. Planetary Analysis (Reference EVERY Planet)
- For each planet: discuss its house placement, dignity (exalted/debilitated/own/moolatrikona/neutral), and Nakshatra
- Highlight any **retrograde** planets and their karmic significance
- Highlight any **combust** planets and the impact on their significations
- Discuss the Navamsa sign of key planets (especially Venus for relationships, Jupiter for wisdom)

## 3. Yoga Analysis
- Explain each detected yoga in detail — what it means practically for the native
- If no yogas detected, explain why and mention any near-misses

## 4. House-wise Analysis
- **Wealth (2nd & 11th houses)**: Financial prospects and gains
- **Communication & Courage (3rd house)**: Skills and siblings
- **Home & Mother (4th house)**: Domestic happiness, property, vehicles
- **Children & Intelligence (5th house)**: Creativity, children, speculation
- **Career & Status (10th house)**: Professional life, reputation, authority
- **Relationships & Marriage (7th house)**: Partnership, spouse characteristics
- **Spirituality (9th & 12th houses)**: Fortune, higher learning, foreign travel

## 5. Vimshottari Dasha: Current & Upcoming Periods
- Detailed analysis of the current Maha Dasha ({current_maha}) and Antar Dasha ({current_antar})
- What to expect in the current sub-period — specific life areas affected
- Brief forecast for the next 2-3 upcoming antardasha periods

## 6. Navamsa (D9) Deep Dive
- Analyze the D9 chart for marriage timing, spouse characteristics, and soul purpose
- Compare D1 vs D9 positions for key planets (Venus, Jupiter, 7th lord)

FORMATTING RULES:
- Use **bold** for all planet names, sign names, and key astrological terms
- Use bullet points for lists
- Keep paragraphs focused and practical
- Target 800-1200 words (1-2 full pages)
- Be specific and reference actual house numbers, signs, and degrees from the data
- Do NOT suggest any remedies, mantras, gemstones, or rituals — this is a pure analysis report
- End the report with this affirmative closing note on its own line: "*This report is crafted using Vedic Jyotish principles and AI-powered. Use these insights as a guiding light on your journey — for deeper personalised guidance, consult a qualified Jyotishi.*"
"""

        async def stream_report():
            try:
                response = ai_model.models.generate_content_stream(
                    model=GEMINI_MODEL_NAME,
                    contents=report_prompt,
                )
                for chunk in response:
                    if chunk.text:
                        yield f"data: {json.dumps({'text': chunk.text})}\n\n"
                yield f"data: {json.dumps({'done': True})}\n\n"
            except Exception as e:
                logger.error(f"Report Stream Error: {e.__class__.__name__}: Failed to generate response.")
                yield f"data: {json.dumps({'error': 'Report generation failed. Please try again.'})}\n\n"

        return StreamingResponse(stream_report(), media_type="text/event-stream")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Report Error: {e.__class__.__name__}: Failed to generate response.")
        raise HTTPException(status_code=500, detail="Report generation failed. Please try again." if IS_PRODUCTION else str(e))

@app.post("/chat_with_astrologer")
@limiter.limit("5/minute")
async def chat_with_astrologer_endpoint(request: Request, chat_request: ChatRequest):
    if not ai_model:
        raise HTTPException(status_code=503, detail="AI Service is currently unavailable. Please check API Key.")

    try:
        if len(chat_request.history) >= (MAX_QUESTIONS * 2):
            return { "response": "I apologize, the question limit has been reached." }

        # Build comprehensive context for chat
        cd = chat_request.chart_data
        
        # Find current dasha/antardasha
        current_maha = cd.get('vimshottari_timeline', [{}])[0].get('lord', 'Unknown')
        current_antar = "Unknown"
        for md in cd.get('vimshottari_timeline', []):
            try:
                md_start = datetime.strptime(md['start'], "%d-%m-%Y")
                md_end = datetime.strptime(md['end'], "%d-%m-%Y")
                if md_start <= datetime.now() <= md_end:
                    current_maha = md['lord']
                    for ad in md.get('antardashas', []):
                        ad_start = datetime.strptime(ad['start'], "%d-%m-%Y")
                        ad_end = datetime.strptime(ad['end'], "%d-%m-%Y")
                        if ad_start <= datetime.now() <= ad_end:
                            current_antar = f"{ad['lord']} ({ad['start']} to {ad['end']})"
                            break
                    break
            except: pass

        # Planet summary with full detail
        planet_summary = []
        for p in cd.get('planetary_table', []):
            flags = []
            if p.get('retrograde'): flags.append('R')
            if p.get('combust'): flags.append('C')
            flag_str = f" [{','.join(flags)}]" if flags else ""
            planet_summary.append(
                f"{p['name']}: {p['sign']} H{p['house']} ({p['dignity']}, Nak:{p['nakshatra']} P{p['pada']}, Nav:{p['navamsa_sign']}{flag_str})"
            )

        # Yoga summary
        yoga_str = ', '.join(f"{y['name']} ({y['type']})" for y in cd.get('yogas', [])) or 'None'

        # Navamsa lagna
        nav_lagna = cd.get('navamsa_chart', {}).get('house_1', {}).get('sign', 'Unknown')

        chart_context = f"""
        Chart:
        Ascendant: {cd['ascendant']['sign']}
        Moon: {cd['moon_intelligence']['sign']} ({cd['moon_intelligence']['nakshatra']} Pada {cd['moon_intelligence']['pada']})
        Current Maha Dasha: {current_maha} | Antar Dasha: {current_antar}
        Navamsa Lagna: {nav_lagna}
        Yogas: {yoga_str}
        Planets: {chr(10).join(planet_summary)}
        """
        
        sys_prompt = """
        You are an expert Vedic Astrologer. 
        Analyze the chart.
        FORMATTING RULES:
        1. Use **Bold** for Planet Names and Key Terms.
        2. Use bullet points for lists.
        3. Keep paragraphs short.
        """
        
        gemini_history = [{"role": "user", "parts": [{"text": f"{sys_prompt}\n\n{chart_context}"}]}, {"role": "model", "parts": [{"text": "Understood."}]}]
        for msg in chat_request.history:
            gemini_history.append({"role": "user" if msg.role == "user" else "model", "parts": [{"text": msg.text}]})

        chat = ai_model.chats.create(model=GEMINI_MODEL_NAME, history=gemini_history)

        async def stream_chat():
            try:
                response = chat.send_message_stream(chat_request.question)
                for chunk in response:
                    if chunk.text:
                        yield f"data: {json.dumps({'text': chunk.text})}\n\n"
                yield f"data: {json.dumps({'done': True})}\n\n"
            except Exception as e:
                logger.error(f"Chat Stream Error: {e.__class__.__name__}: Failed to converse with Astrologer.")
                yield f"data: {json.dumps({'error': 'Chat service encountered an error. Please try again.'})}\n\n"

        return StreamingResponse(stream_chat(), media_type="text/event-stream")

    except Exception as e:
        logger.error(f"Chat Error: {e.__class__.__name__}: Failed to converse with Astrologer.")
        raise HTTPException(status_code=500, detail="Chat service encountered an error. Please try again." if IS_PRODUCTION else str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)