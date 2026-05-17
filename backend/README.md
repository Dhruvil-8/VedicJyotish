---
title: VedicJyotish
emoji: 🕉️
colorFrom: yellow
colorTo: red
sdk: docker
pinned: false
short_description: Ancient Calculations. AI‑Assisted Interpretation.
---

# Vedic Jyotish API Server

This Hugging Face Space hosts the high-performance FastAPI backend for the **Vedic Jyotish** application.

## Specifications
* **SDK:** Docker
* **Runtime Port:** 7860 (Hugging Face default)
* **Astrology Ephemeris:** Swiss Ephemeris (`pyswisseph`)
* **AI engine:** Google Gemini Pro (`google-genai`)

## Technical Setup
This backend processes birth dates, coordinates, and charts locally using Swiss Ephemeris, then streams real-time AI interpretations to the Cloudflare-hosted frontend via Server-Sent Events (SSE).

*For the complete codebase and frontend interface, visit [GitHub: Dhruvil-8/VedicJyotish](https://github.com/Dhruvil-8/VedicJyotish).*
