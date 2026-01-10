# Meme Coin Aggregator

Backend service aggregating real-time meme coin data from DexScreener and Jupiter APIs.

## Features
- **Real-time Data**: Aggregates data from multiple DEX sources.
- **Hybrid Serving**: REST API for initial load, WebSockets for live updates.
- **Smart Caching**: Redis-first architecture with in-memory fallback.

## Quick Start
1. Install: `npm install`
2. Run Redis (optional): `docker-compose up -d`
3. Start: `npm start`

## API
- `GET /tokens?limit=10&sort_by=volume_sol`

## WebSockets
- Connect to `ws://localhost:3000`
- Event: `price-update`
