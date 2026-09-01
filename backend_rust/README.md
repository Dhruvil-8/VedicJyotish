# VedicJyotish Rust Backend

> [!WARNING]
> **DISCLAIMER**: This backend engine is currently in its active development and testing phase. Features, API models, and calculation parameters are subject to refinement as we complete thorough validation

A high-performance, modular Vedic Astrology API built using Rust, Axum, and Swiss Ephemeris. It serves as a backend service for birth chart calculations, city lookups, transit analysis, and AI-driven astrological interpretation.

---

## Core Capabilities

* **High-Precision Ephemeris**: Powered by the Swiss Ephemeris library, computing planetary longitudes, apparent daily motion speeds, house cusps, and divisional charts (Vargas D1 through D60).
* **Dynamic Calculation Profiles**:
  * **Ayanamsas**: Lahiri, Raman, Krishnamurti (KP), Sri Yukteshwar, True Chitra, True Pushya, Surya Siddhanta, Fagan Bradley, and Tropical.
  * **Lunar Node Toggles**: Both Mean Node (`SE_MEAN_NODE`) and True Node (`SE_TRUE_NODE`) for Rahu and Ketu.
  * **House Systems**: Whole Sign, Equal (`b'A'`), Sripati / Porphyry (`b'O'`), Placidus (`b'P'`), Koch (`b'K'`), Campanus (`b'C'`), and Regiomontanus (`b'R'`).
* **Vimshottari Dasha Hierarchy (Levels 1, 2, and 3)**:
  * Generates **Maha Dasha**, **Antar Dasha**, and **Pratyantar Dasha** sub-periods over the classical 120-year cycle.
  * Configurable year lengths: Sidereal Year (`365.256363004` days), Savana Year (`360.0` days), and Tropical Solar Year (`365.24219` days).
* **Ashtakavarga with Classical Reductions**:
  * Computes planetary grids (**Bhinnashtakavarga - BAV**) and collective totals (**Sarvashtakavarga - SAV**, 337 points).
  * **Trikona Shodhana**: Trinal minimum reduction across all 4 elemental trikonas.
  * **Ekadhipatya Shodhana**: Dual-lordship reduction across Mars, Mercury, Jupiter, Venus, and Saturn co-owned signs, accounting for occupant and Lagna presence.
  * **Shodhya Pindas**: Calculates Rasi Pinda, Graha Pinda, and total Shodhya Pinda for all 7 classical grahas.
* **Bhava Chalit (Cuspal System)**: Computes exact start degree (Sandhi), cusp degree (Bhava Madhya), end degree (Sandhi), and planets residing in each of the 12 houses.
* **Classical Upagrahas (Shadow Planets)**: Exact calculations for Dhuma, Vyatipata, Parivesha, Indrachapa, Upaketu, Gulika, and Mandi.
* **Jaimini Astrology Core**:
  * **Chara Karakas**: 7-karaka scheme (AK, AmK, BK, MK, PK, GK, DK) with Rahu reverse calculation.
  * **All 12 Bhava Arudhas**: Full calculation of A1 (Arudha Lagna) through A12 (Upapada Lagna A12) with classical 1st/7th house adjustments.
  * **Special Lagnas**: Hora Lagna (HL), Ghati Lagna (GL), Sree Lagna (SL), and Indu Lagna (IL).
  * **Argala & Virodhargala Solver**: Computes unobstructed intervention and obstruction houses with Ketu reverse counting.
  * **Chara Dasha Timeline**: Computes sign-based chronological periods with dual-lord strength tie-breakers.
* **Shadbala (Six-Fold Planetary Strength)**:
  * Computes *Sthana* (positional), *Dig* (directional), *Kaala* (temporal), *Cheshta* (motional using true daily speed ratios), *Naisargika* (natural), and *Drik* (aspectual) strengths.
* **Bhava Bala & Graha Yuddha**: 12-house strength assessment and true astronomical planetary war collision resolution (< 1° conjunction).
* **Panchanga Engine**: Weekday lord (*Vara*), *Tithi*, *Nakshatra*, *Yoga*, and *Karana*, Sunrise/Sunset, Muhurtas, Choghadiya, and multi-system lunar calendars (Amanta, Purnimanta, Adhik/Nija masa detection).
* **Guna Milan Compatibility**: Standard 36-point Ashta Koota matching with Mahendra, Stree Deergha, and dosha mitigations.
* **AI Report & Chat Streaming**: Server-Sent Events (SSE) streaming with Google Gemini, incorporating privacy-preserving PII stripping and dynamic topic focus context filters (Career, Relationship, Wealth, Health, Education, General).

---

## API Endpoints

All endpoints support optional calculation profiles (`profile`) and optional API key validation.

### 1. System & Atlas Lookups
* `GET /` - Health check, engine version, and uptime metadata.
* `GET /search_city?query=<name>` - Prefix query against local GeoNames SQLite database.

### 2. Chart Calculations
* `POST /calculate_chart` - Basic chart computation (D1, D9, planetary table, yogas, Vimshottari).
* `POST /api/v1/chart/full` - Enterprise-grade chart calculation containing full Vargas (D1..D60), Shadbala, Bhava Bala, Bhava Chalit cusps, Upagrahas, Ashtakavarga reductions, Shodhya Pindas, and all 12 Bhava Arudhas.
* `POST /calculate_transits` - Real-time planetary transits relative to natal Lagna and natal Moon.
* `POST /calculate_calendar` - Monthly Panchanga calendar across Gregorian, Amanta, and Purnimanta modes.

### 3. Jaimini & Granular Modules
* `POST /api/v1/chart/argala` - Jaimini Argala and Virodhargala solver.
* `POST /api/v1/chart/dasha/chara` - Jaimini Chara Dasha sign timeline.
* `POST /api/v1/chart/ashtakavarga` - Ashtakavarga BAV, SAV, reductions, and Shodhya Pindas.
* `POST /api/v1/chart/rasi` - Rasi (D1) details.
* `POST /api/v1/chart/navamsa` - Navamsa (D9) details.
* `POST /api/v1/chart/varga?division=D10` - Targeted divisional chart positions (D2..D60).
* `POST /api/v1/chart/drishti` - Graha and Rasi aspects.
* `POST /api/v1/match/compatibility` - Ashta Koota compatibility matching.

### 4. AI Astrological Consultation (Streaming)
* `POST /generate_report` - Real-time SSE streaming of structured 3-page celestial analysis.
* `POST /chat_with_astrologer` - Real-time SSE streaming for multi-turn astrological chat consultations with conversation memory and topic filters.

---

## Local Setup & Testing

### Prerequisites
* Rust toolchain (Rust 1.86+)
* C compiler (gcc / clang / MSVC) for Swiss Ephemeris C-library compilation

### Run Tests
```bash
cargo test --bin backend_rust
```
All 36 unit and integration test suites will run, verifying mathematical correctness across:
* Astronomical longitudes & Ephemeris
* Ashtakavarga classical reductions & Shodhya Pindas
* Chara Dasha co-lord resolution
* Adhik Masa & Saṅkrānti calendar algorithms
* Neechabhanga Raja Yogas & Doshas
* Profile dispatch (Raman, KP, True Nodes, Equal houses, Savana year)

### Run Server
```bash
cargo run --release
```
The server starts on port `7860` (or `PORT` environment variable).

---

## Credits & References

* **Swiss Ephemeris**: Astronomical calculations are powered by the professional-grade Swiss Ephemeris library.
* **Jagannatha Hora (JHora) & PyJHora**: [JHora](https://www.vedicastrologer.org/jh/) and the open-source [PyJHora](https://github.com/naturalstupid/PyJHora) project were used as references during development and manual verification of selected chart calculations.
