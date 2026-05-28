# VedicJyotish Rust Backend

A high-performance Vedic Astrology API built using Rust, Axum, and the Swiss Ephemeris. It serves as a backend service for birth chart calculations, city lookups, transit analysis, and AI astrological readings.

---

## API Endpoints

### 1. API Status
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
* **Parameters**:
  * `query`: Name of the city (minimum 3 characters)
* **Response**: Matches ranking cities from the GeoNames database.
```json
[
  { "name": "London, ENG, GB", "lat": 51.50853, "lon": -0.12574 }
]
```

### 3. Chart Calculation
* **Route**: `POST /calculate_chart`
* **Body**:
```json
{
  "date": "28/05/1998",
  "time": "12:30",
  "city": "Mumbai",
  "timezone": 5.5
}
```
* **Response**: Calculates planetary longitudes, house placements (D1 and D9), Vimshottari Dasha intervals, and detected yogas (Gaja Kesari, Adhi, Amala, Guru Mangala, Nabhasa, and others).

### 4. Planetary Transits
* **Route**: `POST /calculate_transits`
* **Body**:
```json
{
  "birth_data": {
    "date": "28/05/1998",
    "time": "12:30",
    "city": "Mumbai",
    "timezone": 5.5
  },
  "transit_date": "28/05/2026",
  "transit_time": "12:00"
}
```
* **Response**: Returns current transit planetary positions overlaid against the native's natal Lagna and Moon houses.

### 5. AI Report Generation
* **Route**: `POST /generate_report`
* **Body**: Birth chart data payload
* **Response**: Streams a markdown astrology report via Server-Sent Events (SSE).

### 6. AI Astrologer Chat
* **Route**: `POST /chat_with_astrologer`
* **Body**:
```json
{
  "chart_data": { ... },
  "question": "What is the impact of my current dasha?",
  "history": []
}
```
* **Response**: Streams a conversational response from a virtual astrologer via Server-Sent Events (SSE).

---

## Local Setup

### Prerequisites
* Rust toolchain (Rust 1.86+)
* Build essentials (gcc/clang) for compiling C-bindings

### Configuration
Create a `.env` file in the root of the `backend_rust` directory:
```env
PORT=7860
ENVIRONMENT=development
GEMINI_API_KEY=your_gemini_api_key
```

### Run Server
```bash
cargo build --release
cargo run --release
```
The server will start on port `7860`.
