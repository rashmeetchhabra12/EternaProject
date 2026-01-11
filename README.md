# EternaFlow - Real-time Meme Coin Aggregator

A real-time cryptocurrency dashboard that pulls meme coin data from multiple sources and displays live price updates. Built as a learning project to understand WebSockets, caching strategies, and scalable backend architecture.

## What This Project Does

Basically, it's a live dashboard that shows meme coins trading on Solana DEXs. You can search for tokens, sort by different metrics (volume, market cap, price changes), and see prices update in real-time without refreshing the page.

The interesting part is how it handles data - instead of hammering external APIs with every user request, I built a background worker that fetches data every 15 seconds and caches it in Redis. This way the frontend always gets instant responses.

## Tech Stack

**Frontend:**
- React with TypeScript
- Vite for dev server
- Socket.io for WebSocket connections
- Framer Motion for animations

**Backend:**
- Node.js + Express
- TypeScript
- Socket.io (server)
- Redis for caching
- node-cron for scheduled tasks

**Data Sources:**
- DexScreener API (primary source)
- Jupiter API (backup/additional data)

## How It Works

### The Architecture

```
Frontend (React) 
    ↓
REST API + WebSocket
    ↓
Redis Cache ← Background Worker (fetches every 15s)
    ↓
External APIs (DexScreener, Jupiter)
```

### Key Design Choices

**1. Why the background worker?**

Instead of fetching from DexScreener/Jupiter on every API request, I run a cron job every 15 seconds that:
- Fetches fresh data from both sources
- Merges & deduplicates tokens
- Stores everything in Redis with a 30-second TTL

This means API requests are super fast (just reading from cache) and we don't hit rate limits on external APIs.

**2. WebSocket for real-time updates**

The frontend makes one REST call on page load to get initial data, then subscribes to WebSocket events. Whenever the background worker fetches new data, it broadcasts to all connected clients. This is way more efficient than polling.

**3. Two-tier caching**

Primary cache is Redis (shared across all backend instances if you scale horizontally). If Redis is down, there's an in-memory fallback so the app doesn't crash. Not the most sophisticated setup but it works.

**4. Cursor-based pagination**

I went with cursor pagination instead of offset-based because:
- Offset pagination has issues when the data changes between page loads (you can skip items)
- Cursor is more stable - it's basically just the index of the last item you saw

The API returns a `nextCursor` that the frontend uses for the next page.

## Setup & Running Locally

### Prerequisites
- Node.js (v18+)
- Redis server

### Installation

```bash
# Clone and install backend deps
npm install

# Install frontend deps
cd frontend
npm install
cd ..

# Start Redis
./redis/redis-server.exe  # Windows
# or
redis-server  # Linux/Mac

# Start backend (in one terminal)
npm start

# Start frontend (in another terminal)
cd frontend
npm run dev
```

Then open http://localhost:5173

## API Documentation

### GET /tokens

Query params:
- `q` - Search by token name or address
- `sort_by` - Options: `volume_sol`, `market_cap_sol`, `price_1hr_change`, `price_24hr_change`, `price_7d_change`
- `limit` - Items per page (default 10)
- `cursor` - For pagination

Response:
```json
{
  "data": [...],
  "nextCursor": "20"
}
```

### WebSocket Events

Connect to `ws://localhost:3000`

Events:
- `connect` - Connection established
- `price-update` - Server broadcasts updated token list
- `disconnect` - Connection lost

## Project Structure

```
├── frontend/
│   ├── src/
│   │   ├── App.tsx          # Main React component
│   │   └── index.css        # Styles (glassmorphism theme)
│   └── package.json
│
├── src/
│   ├── api/
│   │   ├── server.ts        # Express + Socket.io setup
│   │   └── tokenController.ts
│   ├── services/
│   │   ├── cache.ts         # Redis wrapper
│   │   ├── fetcher.ts       # API clients
│   │   └── aggregator.ts    # Token merging logic
│   ├── worker/
│   │   └── scheduler.ts     # Background cron job
│   └── types/
│       └── index.ts
│
└── package.json
```

## Design Decisions & Tradeoffs

### Stateless Backend
Kept the Express server completely stateless - all state lives in Redis. This means you could theoretically run multiple backend instances behind a load balancer and they'd all share the same cache. I didn't implement actual load balancing but the architecture supports it.

### Cache TTL Strategy
Set Redis TTL to 30 seconds but the worker fetches every 15 seconds. This means even if the worker fails once, we still have cached data. The downside is you might see slightly stale data (worst case 30 seconds old).

### Error Handling
The HTTP client has exponential backoff retry logic - if DexScreener rate limits us, it waits [1s, 2s, 4s] before giving up. Also if Redis crashes, the app falls back to in-memory cache instead of erroring out.

### UI Color Scheme
Went with a dark theme with amber/coral accents instead of the typical blue/purple gradients. Wanted something that didn't look obviously AI-generated. The glassmorphism effect uses `backdrop-filter: blur()` which is pretty standard these days.

## Things I Learned

- How to implement WebSocket connections properly (Socket.io makes this way easier than raw WebSockets)
- Redis is really fast but you need to think about TTLs and cache invalidation
- Cursor pagination is better than offset for real-time data
- Exponential backoff is essential when dealing with external APIs
- TypeScript types can save you from a lot of runtime errors

## Known Issues / Future Improvements

- The 7-day price change data is often missing from the free APIs, so it shows 0% a lot
- No historical charts yet (would need to store time-series data)
- Search is basic string matching - could use fuzzy matching
- No wallet integration for portfolio tracking
- Mobile responsive but could be better

## Why This Project?

Built this to learn about real-time systems and scalable architecture patterns. The crypto space has a lot of interesting technical challenges - high-frequency data updates, rate limits on free APIs, need for caching, etc.

Also wanted to practice with WebSockets, Redis, and TypeScript in a real project instead of just tutorials.

---

Feel free to clone, modify, or use this as a reference for your own projects.
