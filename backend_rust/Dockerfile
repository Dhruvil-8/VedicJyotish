# ============================================================
# VedicJyotish Rust Backend — Docker build for Hugging Face Spaces
# ============================================================
# Multi-stage build:
#   Stage 1: Compile Rust binary in full SDK image
#   Stage 2: Slim runtime image with only the binary + data
# ============================================================

# ── Stage 1: Builder ─────────────────────────────────────────
FROM rust:1.86-slim-bookworm AS builder

# Install build dependencies for swiss-eph (C compiler) and SQLite
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential \
        pkg-config \
        libssl-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy manifest files first for dependency layer caching
COPY Cargo.toml Cargo.lock ./

# Create a dummy main.rs to build dependencies (cache layer)
RUN mkdir -p src/bin && \
    echo 'fn main() { println!("placeholder"); }' > src/main.rs && \
    echo 'fn main() { println!("placeholder"); }' > src/bin/import_geonames.rs && \
    cargo build --release 2>/dev/null || true && \
    rm -rf src

# Copy actual source code
COPY src/ src/

# Force Cargo to rebuild by touching all source files (overcoming Docker/Cargo mtime caching)
RUN find src -name "*.rs" -exec touch {} +

# Build the real binary
RUN cargo build --release --bin backend_rust && \
    strip target/release/backend_rust

# ── Stage 2: Runtime ─────────────────────────────────────────
FROM debian:bookworm-slim AS runtime

# Install minimal runtime dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        ca-certificates \
        libssl3 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN adduser --disabled-password --gecos '' appuser

WORKDIR /app

# Copy the compiled binary
COPY --from=builder /app/target/release/backend_rust ./backend_rust

# Copy the locations database for offline city search
COPY data/locations.db ./data/locations.db

# Set ownership
RUN chown -R appuser:appuser /app

USER appuser

# HF Spaces expects port 7860
EXPOSE 7860

# Environment defaults (overridden by HF Space secrets)
ENV PORT=7860 \
    ENVIRONMENT=production \
    LOCATION_DB_PATH=/app/data/locations.db \
    SWISS_EPHE_PATH=/app/ephe \
    RUST_LOG=warn

CMD ["./backend_rust"]
