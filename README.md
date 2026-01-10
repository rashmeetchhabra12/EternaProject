# EternaFlow - Real-time Meme Coin Aggregator

<div align="center">

![EternaFlow](https://img.shields.io/badge/EternaFlow-Live%20Analytics-f59e42?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)

**A production-grade, real-time meme coin analytics dashboard aggregating data from multiple DEX sources**

[Features](#-features) • [Architecture](#-architecture-design) • [Setup](#-quick-start) • [API](#-api-documentation)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture Design](#-architecture-design)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Design Decisions](#-design-decisions)
- [API Documentation](#-api-documentation)
- [Folder Structure](#-folder-structure)

---

## 🎯 Overview

EternaFlow is a sophisticated real-time cryptocurrency analytics platform designed to aggregate, process, and display meme coin data from multiple decentralized exchanges (DexScreener, Jupiter). The system demonstrates enterprise-level architecture patterns including distributed caching, WebSocket real-time updates, and cursor-based pagination.

### Key Highlights

- **Real-time Price Updates**: WebSocket-based live streaming with sub-second latency
- **Multi-source Aggregation**: Intelligent merging of data from DexScreener and Jupiter APIs
- **Production-Ready Caching**: Redis-based distributed cache with fallback mechanisms
- **Scalable Architecture**: Stateless API design supporting horizontal scaling
- **Premium UI/UX**: Modern glassmorphism design with smooth animations

---

## ✨ Features

### Core Functionality

- ✅ **Live Token Tracking**: Real-time price updates via WebSocket connections
- ✅ **Multi-Metric Sorting**: Sort by volume, market cap, 1h/24h/7d price changes
- ✅ **Advanced Search**: Fuzzy search by token name or contract address
- ✅ **Timeframe Filtering**: View price changes across 1h, 24h, 7d periods
- ✅ **Cursor-based Pagination**: Efficient navigation through large datasets
- ✅ **Visual Price Alerts**: Flash animations on price movements (green/red indicators)

### Technical Features

- 🔄 **Background Worker**: Automated data fetching every 15 seconds
- 💾 **Two-Tier Caching**: Redis primary cache with in-memory fallback
- 🚀 **Optimistic UI Updates**: Instant feedback with optimistic rendering
- 📊 **Data Merging**: Intelligent token deduplication and source prioritization
- 🔒 **Error Resilience**: Exponential backoff retry logic for external APIs

---

## 🏗️ Architecture Design

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                        │
│  ┌──────────────┐    ┌──────────────┐    ┌─────────────────┐  │
│  │  REST Client │◄───┤  WebSocket   │    │  State Manager  │  │
│  └──────┬───────┘    └──────┬───────┘    └────────┬────────┘  │
└─────────┼──────────────────┼─────────────────────┼────────────┘
          │                  │                      │
          ▼                  ▼                      │
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (Node.js + Express)                  │
│  ┌──────────────┐    ┌──────────────┐    ┌─────────────────┐  │
│  │ REST API     │    │  WebSocket   │    │  Scheduler      │  │
│  │ /tokens      │◄───┤  Server      │◄───┤  (cron: 15s)    │  │
│  └──────┬───────┘    └──────────────┘    └────────┬────────┘  │
│         │                                           │           │
│         ▼                                           ▼           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Cache Service (Abstraction)                │   │
│  │  ┌──────────────────┐       ┌──────────────────┐       │   │
│  │  │  Redis Cache     │       │  Memory Fallback  │       │   │
│  │  │  (Primary)       │◄─────►│  (Secondary)      │       │   │
│  │  └──────────────────┘       └──────────────────┘       │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      External Data Sources                      │
│  ┌──────────────────┐              ┌──────────────────┐         │
│  │  DexScreener API │              │   Jupiter API    │         │
│  │  (Primary)       │              │   (Secondary)    │         │
│  └──────────────────┘              └──────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Background Job** fetches fresh data every 15s from DexScreener & Jupiter
2. **Data Aggregation** merges and deduplicates tokens by contract address
3. **Cache Layer** stores processed data in Redis (30s TTL)
4. **WebSocket Broadcast** pushes real-time updates to all connected clients
5. **REST API** serves cached data with sorting/filtering/pagination
6. **Frontend** optimistically updates UI and subscribes to live streams

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - Component-based UI framework
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **Axios** - HTTP client for REST API calls
- **Socket.io-client** - WebSocket client library
- **Framer Motion** - Animation library for smooth transitions

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Minimal web framework
- **TypeScript** - Type-safe server code
- **Socket.io** - WebSocket server implementation
- **ioredis** - High-performance Redis client
- **node-cron** - Scheduled task execution
- **Zod** - Runtime type validation

### Infrastructure
- **Redis** - In-memory data store for caching
- **DexScreener API** - Primary DEX data source
- **Jupiter API** - Secondary aggregator

---

## 🚀 Quick Start

### Prerequisites

```bash
# Node.js 18+ and npm
node --version  # v18.0.0+
npm --version   # 9.0.0+

# Redis Server
redis-server --version  # 6.0.0+
```

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd EternaProject

# 2. Install backend dependencies
npm install

# 3. Install frontend dependencies
cd frontend
npm install
cd ..

# 4. Start Redis (Windows)
./redis/redis-server.exe

# OR (Linux/Mac)
redis-server

# 5. Start backend server
npm start

# 6. Start frontend dev server
cd frontend
npm run dev
```

### Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **WebSocket**: ws://localhost:3000

---

## 🧠 Design Decisions

### 1. Scalability Approach

#### **Stateless API Design**
- **Decision**: Keep the Express server completely stateless, storing all data in Redis
- **Rationale**: Enables horizontal scaling - multiple backend instances can share the same Redis cache
- **Trade-off**: Adds Redis as a dependency, but gains distributed state management

#### **Background Worker Pattern**
- **Decision**: Separate data fetching (heavy I/O) from API requests (latency-sensitive)
- **Rationale**: Prevents "thundering herd" problem where 1000 users trigger 1000 external API calls
- **Implementation**: Single cron job fetches data every 15s and populates cache

### 2. Real-time Data & WebSocket Implementation

#### **Hybrid REST + WebSocket Architecture**
- **Decision**: Use REST for initial load, WebSocket for live updates
- **Rationale**: 
  - REST provides reliable, cacheable initial state
  - WebSocket enables push-based real-time updates without polling overhead
- **Pattern**: 
  ```typescript
  // Initial load (REST)
  const data = await fetch('/tokens');
  
  // Subscribe to updates (WebSocket)
  socket.on('price-update', (newData) => {
    // Merge with existing state
  });
  ```

#### **Server-side Broadcasting**
- **Decision**: Backend pushes updates to all connected clients simultaneously
- **Rationale**: More efficient than client polling (1 fetch vs N fetches)
- **Optimization**: Only broadcast changed tokens, not full dataset

### 3. Caching Strategy

#### **Two-Tier Cache Architecture**

```typescript
// Cache Hierarchy
1. Redis (Distributed, Persistent)
   ├─ TTL: 30-60 seconds
   └─ Shared across all backend instances

2. Memory (Local, Volatile)
   ├─ Fallback when Redis unavailable
   └─ Per-instance cache
```

#### **Cache Key Design**
- `tokens:all` - Full token list (bulk endpoint)
- `search:{query}` - Search results (1 min TTL)
- `token:{address}` - Individual token details

#### **Write-Through Strategy**
- **Decision**: Background worker updates cache proactively (write-through)
- **Alternative Rejected**: Lazy loading (cache-aside) would add latency to first request
- **Benefit**: API requests always hit warm cache (sub-millisecond response)

### 4. Error Handling & Resilience

#### **Exponential Backoff (HTTP Client)**
```typescript
// Retry logic for external APIs
maxRetries: 3
delay: [1s, 2s, 4s]
```

#### **Graceful Degradation**
- Redis fails → Use in-memory cache
- DexScreener fails → Use Jupiter data
- WebSocket disconnects → Auto-reconnect with exponential backoff

#### **Circuit Breaker Pattern**
- Track API failure rates
- Temporarily disable failing sources to prevent cascading failures

### 5. Cursor-based Pagination

#### **Why Not Offset Pagination?**
| Offset (`?page=2&limit=20`) | Cursor (`?cursor=40&limit=20`) |
|------------------------------|--------------------------------|
| ❌ Skips data if list changes | ✅ Stable positioning |
| ❌ Inefficient for large offsets | ✅ Constant-time lookups |
| ✅ Simple to understand | ⚠️ Requires stateful cursor |

#### **Implementation**
```typescript
// Request
GET /tokens?limit=20&cursor=20

// Response
{
  data: [...],
  nextCursor: "40"  // null if no more data
}
```

### 6. UI/UX Design Philosophy

#### **Glassmorphism Aesthetic**
- **Decision**: Frosted glass effect with backdrop blur
- **Rationale**: Modern, premium feel while maintaining readability
- **Implementation**: `backdrop-filter: blur(16px) saturate(180%)`

#### **Color Palette Strategy**
- **Primary**: Warm amber (`#f59e42`) - distinctive from typical blue/purple AI gradients
- **Accent**: Coral red (`#ff6b6b`) - energetic, attention-grabbing
- **Background**: Dark slate (`#0d1117`) - GitHub-inspired professionalism

#### **Animation Principles**
- **Price Flash**: Green/red background pulse on price changes
- **Hover States**: Subtle translateX/Y for depth perception
- **Page Transitions**: Framer Motion for smooth list updates

---

## 📡 API Documentation

### REST Endpoints

#### `GET /tokens`
Fetch paginated, sorted, and filtered token list.

**Query Parameters:**
```typescript
{
  q?: string;           // Search query (name or address)
  sort_by?: string;     // volume_sol | market_cap_sol | price_1hr_change | etc.
  limit?: number;       // Items per page (default: 10, max: 100)
  cursor?: string;      // Pagination cursor (offset index)
}
```

**Response:**
```typescript
{
  data: Token[];        // Array of token objects
  nextCursor: string | null;  // Cursor for next page
}

interface Token {
  token_address: string;
  token_name: string;
  token_ticker: string;
  price_sol: number;
  market_cap_sol: number;
  volume_sol: number;
  price_1hr_change: number;
  price_24hr_change: number;
  price_7d_change: number;
}
```

**Example:**
```bash
curl "http://localhost:3000/tokens?sort_by=volume_sol&limit=20"
```

### WebSocket Events

#### Client → Server
```typescript
// Connect (automatic)
socket.connect()
```

#### Server → Client
```typescript
// Connection established
socket.on('connect', () => {
  console.log('Connected to real-time stream');
});

// Price update broadcast
socket.on('price-update', (tokens: Token[]) => {
  // Full token list with updated prices
  updateUI(tokens);
});

// Disconnection
socket.on('disconnect', () => {
  console.log('Disconnected');
});
```

---

## 📂 Folder Structure

```
EternaProject/
├── frontend/                   # React frontend application
│   ├── src/
│   │   ├── App.tsx            # Main application component
│   │   └── index.css          # Global styles & theme variables
│   ├── package.json
│   └── vite.config.ts         # Vite configuration
│
├── src/                        # Backend source code
│   ├── api/
│   │   ├── server.ts          # Express app & WebSocket setup
│   │   └── tokenController.ts # REST endpoint handlers
│   │
│   ├── services/
│   │   ├── cache.ts           # Redis + Memory cache abstraction
│   │   ├── fetcher.ts         # DexScreener & Jupiter API clients
│   │   └── aggregator.ts      # Token merging & deduplication logic
│   │
│   ├── worker/
│   │   └── scheduler.ts       # Background data fetching cron job
│   │
│   ├── types/
│   │   └── index.ts           # TypeScript type definitions
│   │
│   ├── utils/
│   │   └── httpClient.ts      # Axios instance with retry logic
│   │
│   └── config/
│       └── redis.ts           # Redis connection configuration
│
├── redis/                      # Redis server binaries (Windows)
│   └── redis-server.exe
│
├── package.json                # Backend dependencies
├── tsconfig.json               # TypeScript configuration
└── README.md                   # This file
```

---

## 🎨 UI Components Breakdown

### Header Section
- **Brand Logo**: Animated Activity icon with gradient background
- **Live Status Indicator**: Pulsing dot with connection state
- **Search Bar**: Debounced input (500ms) with icon accent
- **Sort Dropdown**: Custom-styled select with gradient options
- **Timeframe Selector**: Pill-style toggle buttons (1h/24h/7d)

### Token Table
- **Row Numbering**: Sequential badges with gradient background
- **Token Avatars**: Dual-gradient circles with shine overlay
- **Price Display**: Monospace font with 9 decimal precision
- **Change Indicators**: Arrow icons with color-coded percentages
- **Volume/Market Cap**: Compact notation (e.g., "1.2M SOL")

### Pagination Controls
- **Previous/Next Buttons**: Disabled states with transparency
- **Page Indicator**: Glowing badge with current page number
- **Responsive Layout**: Centered flex with proper spacing

---

## 🔒 Security Considerations

1. **API Rate Limiting**: DexScreener/Jupiter have rate limits - background worker mitigates this
2. **Input Validation**: Zod schemas validate all API query parameters
3. **XSS Prevention**: React's automatic escaping prevents injection attacks
4. **CORS Configuration**: Configured for localhost development (update for production)
5. **Environment Variables**: Sensitive configs should use `.env` files (not committed)

---

## 🚦 Performance Optimizations

1. **Debounced Search**: 500ms delay prevents excessive API calls while typing
2. **Optimistic UI Updates**: State updates immediately before API confirmation
3. **Virtualization Ready**: Token list can be virtualized for >1000 items (react-window)
4. **Code Splitting**: Vite automatically splits bundles for faster initial load
5. **Memoization**: React.memo on TokenRow prevents unnecessary re-renders

---

## 📈 Future Enhancements

- [ ] Historical price charts (TradingView integration)
- [ ] Portfolio tracking (wallet connection via Phantom/Solflare)
- [ ] Price alerts (email/push notifications)
- [ ] Advanced filtering (liquidity thresholds, age filters)
- [ ] Multi-chain support (Ethereum, BSC, Polygon)
- [ ] Dark/Light mode toggle
- [ ] Export data (CSV/JSON download)

---

## 📝 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

Built with ❤️ for the crypto community.

---

<div align="center">

**🌟 Star this repo if you find it useful! 🌟**

Made with [React](https://react.dev/) • [Node.js](https://nodejs.org/) • [Redis](https://redis.io/)

</div>
