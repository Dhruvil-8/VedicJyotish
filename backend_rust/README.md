# VedicJyotish Rust Backend

> [!WARNING]
> **DISCLAIMER**: This backend engine is currently in its active development and testing phase. Features, API models, and calculation parameters are subject to refinement as we complete thorough validation

A high-performance, modular Vedic Astrology API built using Rust, Axum, and Swiss Ephemeris. It serves as a backend service for birth chart calculations, city lookups, transit analysis, and AI-driven astrological interpretation.

---

## Core Capabilities

The Rust backend is designed to compute classical Vedic astrology parameters with precision:

* **High-Precision Ephemeris**: Powered by Swiss Ephemeris to compute planetary longitudes, latitudinal speeds, house cusps, and divisional charts (Vargas D1 through D60).
* **Pancha-Dha Planetary Friendship (Five-Fold Friendship)**: Evaluates natural relations (*Naisargika*) and temporal placements (*Tatkalika*) to determine active functional alignments (Great Friend, Friend, Neutral, Enemy, Great Enemy).
* **Vaisheshikamsa Dignity Counts**: Analyzes planetary placements across divisional schemes—including Saptavarga (7), Dashavarga (10), and Shodasavarga (16)—to assign classical divisional grades.
* **Sade Sati Transit tracking**: Monitors transiting Saturn relative to the natal Moon, indicating active phases (12th, 1st, and 2nd houses).
* **Jaimini Argala & Virodhargala Solver**: Resolves planetary interventions (*Argala*) and obstructions (*Virodhargala*), incorporating special rules for Rahu and Ketu as well as malefic exceptions.
* **Jaimini Chara Dasha Timeline**: Computes sign-based mahadashas with proper directionality and duration based on classical Jaimini sign modalities.
* **Vimshottari Dasha Tree**: Tracks planetary mahadashas and sub-dashas over a 120-year lifecycle based on Nakshatra longitudes.
* **Ashtakavarga**: Generates planetary scoring grids (*Bhinnashtakavarga*) and collective score totals (*Sarvashtakavarga*).
* **Guna Milan Compatibility**: Employs Nakshatra and Pada matching across standard criteria for relationship compatibility.
* **Shadbala (Six-Fold Planetary Strength)**: Computes *Sthana* (positional), *Dig* (directional), *Kaala* (temporal), *Cheshta* (motional), *Naisargika* (natural), and *Drik* (aspectual) strengths against Parashari thresholds.
* **Bhava Bala (House Strength)**: Evaluates active strengths of the 12 houses combining house lord's Shadbala, directional factor, and aspects.
* **Graha Yuddha (Planetary War)**: Detects degree clashes under 1° between the five non-luminous planets (Mars, Mercury, Jupiter, Venus, Saturn) and identifies the war victor.
* **Panchanga**: Computes weekday/element lords (*Vara*, *Tithi*, *Nakshatra*, *Yoga*, and *Karana* lords), Lahiri Ayanamsha degrees, and tracks live Sun/Moon transitions.

---

## API Endpoints

All endpoints (except public health checks) support optional calculation profiles (Ayanamsa, Node Type, House System, Dasha Year Length) and require an optional `X-API-KEY` if configured.

### 1. Health Check
* **Route**: `GET /`
* **Response**:
```json
{
  "message": "Vedic Astrology API is running",
  "status": "online",
  "engine": "rust-swiss-eph",
  "version": "0.1.0"
}
```

### 2. City Lookup
* **Route**: `GET /search_city?query=<city_name>`
* **Query Parameters**:
  * `query`: Prefix search string (minimum 3 characters)
* **Response**: Matches ranking cities from the GeoNames database.
```json
[
  { "name": "Ujjain, MP, IN", "lat": 23.1765, "lon": 75.7885 }
]
```

### 3. Basic Chart Calculation
* **Route**: `POST /calculate_chart`
* **Body**:
```json
{
  "date": "28/05/1998",
  "time": "12:30",
  "city": "Mumbai",
  "lat": 19.076,
  "lon": 72.877,
  "timezone": 5.5
}
```
* **Response**: Calculates planetary longitudes, basic house placements, and detected yogas.

### 4. Chart Calculations (v1)
* **Route**: `POST /api/v1/chart/full`
* **Body**:
```json
{
  "birth_data": {
    "date": "28/05/1998",
    "time": "12:30",
    "city": "Mumbai",
    "lat": 19.076,
    "lon": 72.877,
    "timezone": 5.5
  },
  "profile": {
    "ayanamsa": "Lahiri",
    "node_type": "Mean",
    "house_system": "WholeSign",
    "dasha_year": "Sidereal365.256363004"
  }
}
```
* **Response**: Returns a full suite of Vedic calculations including Pancha-Dha Maitri, Vaisheshikamsa counts, Sade Sati transits, Shadbala, Bhava Bala, Graha Yuddha, and yogas.

### 5. Jaimini Argala Solver (v1)
* **Route**: `POST /api/v1/chart/argala`
* **Body**: Same as Chart (contains `birth_data` and optional `profile`)
* **Response**: Returns Jaimini Argala and Virodhargala details for all houses and planets.

### 6. Jaimini Chara Dasha (v1)
* **Route**: `POST /api/v1/chart/dasha/chara`
* **Body**: Same as Chart
* **Response**: Detailed chronological timeline of sign-based Jaimini Chara Dashas.

### 7. Other Granular v1 Endpoints
* `POST /api/v1/chart/rasi` - Rasi (D1) chart details.
* `POST /api/v1/chart/navamsa` - Navamsa (D9) chart details.
* `POST /api/v1/chart/varga?division=D10` - Targeted divisional chart positions (supports D2, D3, D4, D7, D9, D10, D12, D16, D20, D24, D27, D30, D40, D45, D60).
* `POST /api/v1/chart/panchanga` - Panchanga calculation (Tithi, Nakshatra, Yoga, Karana, Vara).
* `POST /api/v1/chart/ashtakavarga` - Sarvashtakavarga & Bhinnashtakavarga points.
* `POST /api/v1/chart/dasha` - Vimshottari Maha Dasha intervals.
* `POST /api/v1/chart/drishti` - Planetary aspects and sign aspects (Graha & Rasi Drishti).
* `POST /api/v1/match/compatibility` - Guna Milan marriage compatibility results.

---

## Local Setup

### Prerequisites
* Rust toolchain (Rust 1.86+)
* Build essentials (gcc/clang) for compiling Swiss Ephemeris C-bindings

### Configuration
Create a `.env` file in the root of the `backend_rust` directory:
```env
PORT=7860
ENVIRONMENT=development
GEMINI_API_KEY=your_gemini_api_key
# Optional: API_SECRET_KEY=your_secured_jwt_token_or_secret
```

### Run Server
```bash
cargo build --release
cargo run --release
```
The server will start on port `7860`.

---

## Credits & References

* Swiss Ephemeris: Astronomical calculations are powered by the professional-grade Swiss Ephemeris library.
* Jagannatha Hora (JHora) & PyJHora: [JHora](https://www.vedicastrologer.org/jh/) and the open-source [PyJHora](https://github.com/naturalstupid/PyJHora) project were used as references during development and manual verification of selected chart calculations.

**Project Status: VedicJyotish project in active development. Comprehensive validation across all implemented calculations is still ongoing.**
