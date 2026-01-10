import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { Activity, ArrowUpRight, ArrowDownRight, TrendingUp, Zap, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './index.css';

// Types
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

const API_URL = 'http://localhost:3000';

function App() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1h' | '24h' | '7d'>('24h');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [sortBy, setSortBy] = useState('volume_sol');
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Pagination State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, sortBy]);

  // Ref to track previous prices for flash effects
  const prevPrices = useRef<Record<string, number>>({});

  const PAGE_LIMIT = 20;

  const sortOptions = [
    { label: 'Volume (High)', value: 'volume_sol' },
    { label: 'Market Cap', value: 'market_cap_sol' },
    { label: '1h Change', value: 'price_1hr_change' },
    { label: '24h Change', value: 'price_24hr_change' },
    { label: '7d Change', value: 'price_7d_change' },
  ];

  useEffect(() => {
    const fetchTokens = async () => {
      setLoading(true);
      setIsSearching(true);

      try {
        let endpoint = `${API_URL}/tokens?limit=${PAGE_LIMIT}&sort_by=${sortBy}`;
        if (debouncedQuery) {
          endpoint += `&q=${debouncedQuery}`;
        }

        // Calculate cursor (offset) based on page
        const cursor = (page - 1) * PAGE_LIMIT;
        if (cursor > 0) {
          endpoint += `&cursor=${cursor}`;
        }

        const res = await axios.get(endpoint);
        const newTokens = res.data.data;

        setTokens(newTokens);
        setHasMore(newTokens.length === PAGE_LIMIT); // If we got a full page, assume more exists

        // Update price map for all tokens (new + old)
        // Ideally we just update for new ones but full rebuild is safe for small lists.
        const priceMap: Record<string, number> = {};
        // prevPrices is technically for flashing. We should keep old values?
        // Actually, logic updates it based on rendered tokens.
        newTokens.forEach((t: Token) => priceMap[t.token_address] = t.price_sol);

        // If we are appending, we don't want to loose old price refs? 
        // Logic updates `prevPrices.current` after fetch? 
        // Actually `prevPrices.current` is updated in `TokenRow` effect. 
        // Here we just init it if we wanted to pre-fill.
        // Let's rely on TokenRow logic.

      } catch (err) {
        console.error("Failed to fetch tokens", err);
      } finally {
        setLoading(false);
        setIsSearching(false);
      }
    };

    fetchTokens();
  }, [debouncedQuery, sortBy, page]); // Depend on page, debouncedQuery, and sortBy

  useEffect(() => {
    // WebSocket Setup (Global)
    const socket: Socket = io(API_URL);

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('price-update', (updatedTokens: Token[]) => {
      setLastUpdated(new Date());
      setTokens(currentTokens => {
        if (currentTokens.length === 0) return [];

        // Only update tokens that are currently in the list (matching search)
        // Or if the update IS the search result? 
        // If user searched "Pepe", and we display Pepe. New price comes for Pepe -> Update.
        // New price for "Bonk" -> Ignore.

        const currentIds = new Set(currentTokens.map(t => t.token_address));
        const updatesMap = new Map(updatedTokens.map(t => [t.token_address, t]));

        return currentTokens.map(t => {
          const update = updatesMap.get(t.token_address);
          return update ? update : t;
        });
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="container">
      {/* Header */}
      <header className="flex justify-between items-center mb-12" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '3rem' }}>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Activity className="text-cyan-400" size={32} color="var(--neon-cyan)" />
            <h1>Eterna<span style={{ color: 'var(--neon-cyan)' }}>Flow</span></h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            {/* Custom Sort Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>Sort by:</span>
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setIsSortOpen(!isSortOpen)}
                  className="glass-panel"
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'var(--text-main)',
                    border: '1px solid var(--glass-border)',
                    outline: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    minWidth: '160px',
                    justifyContent: 'space-between'
                  }}
                >
                  {sortOptions.find(o => o.value === sortBy)?.label}
                  <ArrowDownRight size={14} style={{ transform: isSortOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                </button>

                {isSortOpen && (
                  <div className="glass-panel" style={{
                    position: 'absolute',
                    top: '110%',
                    left: 0,
                    width: '100%',
                    borderRadius: '12px',
                    background: '#0f172a', // Solid dark bg for dropdown
                    border: '1px solid var(--glass-border)',
                    padding: '0.5rem',
                    zIndex: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                  }}>
                    {sortOptions.map(opt => (
                      <div
                        key={opt.value}
                        onClick={() => {
                          setSortBy(opt.value);
                          setIsSortOpen(false);
                        }}
                        style={{
                          padding: '0.5rem 0.75rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          background: sortBy === opt.value ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                          color: sortBy === opt.value ? 'var(--neon-cyan)' : 'var(--text-muted)',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-main)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = sortBy === opt.value ? 'var(--neon-cyan)' : 'var(--text-muted)'}
                      >
                        {opt.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Timeframe Selector */}
            <div className="glass-panel" style={{ padding: '0.25rem', borderRadius: '12px', display: 'flex', gap: '0.25rem' }}>
              {(['1h', '24h', '7d'] as const).map(tf => (
                <button
                  key={tf}
                  onClick={() => setSelectedTimeframe(tf)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    background: selectedTimeframe === tf ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: selectedTimeframe === tf ? 'var(--text-main)' : 'var(--text-muted)',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    transition: 'all 0.2s'
                  }}
                >
                  {tf.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="glass-panel" style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: connected ? 'var(--neon-green)' : 'var(--neon-pink)', boxShadow: connected ? '0 0 10px var(--neon-green)' : '' }}></div>
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{connected ? 'Live Stream' : 'Connecting...'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ width: '100%', maxWidth: '600px', position: 'relative' }}>
          <input
            type="text"
            placeholder="Search by token name or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '1rem 1.5rem',
              paddingLeft: '3rem',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--glass-border)',
              borderRadius: '16px',
              color: 'white',
              fontSize: '1.1rem',
              backdropFilter: 'blur(10px)',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            <Zap size={20} />
          </div>
        </div>

      </header>

      {/* Stats Cards - Hidden on empty search or keep? Requirements say "by default it should not show any particular toke". 
         I will hide main table if empty. Keep stats or hide?
         Stats "Active Tokens" implies aggregated count. I'll keep stats but maybe zero out or show global?
         For simplicity, I'll hide everything if no search.
      */}

      {/* Main Table */}
      <div className="glass-card" style={{ padding: '1rem' }}>
        <div className="token-row token-header">
          <span>#</span>
          <span>Token</span>
          <span>Price (SOL)</span>
          <span>{selectedTimeframe} Change</span>
          <span>Volume</span>
          <span>Market Cap</span>
        </div>

        <div className="token-grid">
          <AnimatePresence>
            {loading && tokens.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Updating Feed...</div>
            ) : (
              <>
                {tokens.length > 0 ? (
                  tokens.map((token, index) => (
                    <TokenRow
                      key={token.token_address}
                      token={token}
                      index={index + 1}
                      prevPrice={prevPrices.current[token.token_address]}
                      timeframe={selectedTimeframe}
                    />
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No tokens found for "{debouncedQuery}"</div>
                )}

                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', marginTop: '2rem', padding: '1rem' }}>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                    className="glass-panel"
                    style={{
                      padding: '0.5rem 1.5rem',
                      borderRadius: '12px',
                      background: page === 1 ? 'transparent' : 'rgba(255,255,255,0.05)',
                      color: page === 1 ? 'var(--text-muted)' : 'var(--text-main)',
                      border: page === 1 ? '1px solid transparent' : '1px solid var(--glass-border)',
                      cursor: page === 1 ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      transition: 'all 0.2s'
                    }}
                  >
                    &larr; Prev
                  </button>

                  <span style={{ fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    Page {page}
                  </span>

                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={!hasMore || loading}
                    className="glass-panel"
                    style={{
                      padding: '0.5rem 1.5rem',
                      borderRadius: '12px',
                      background: !hasMore ? 'transparent' : 'rgba(255,255,255,0.05)',
                      color: !hasMore ? 'var(--text-muted)' : 'var(--text-main)',
                      border: !hasMore ? '1px solid transparent' : '1px solid var(--glass-border)',
                      cursor: !hasMore ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      transition: 'all 0.2s'
                    }}
                  >
                    Next &rarr;
                  </button>
                </div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Sub-components

const StatCard = ({ title, value, sub, icon }: any) => (
  <div className="glass-card" style={{ padding: '1.5rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{title}</span>
      <div style={{ padding: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>{icon}</div>
    </div>
    <div style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>{value}</div>
    <div style={{ fontSize: '0.875rem', color: 'var(--neon-green)' }}>{sub}</div>
  </div>
);

const TokenRow = ({ token, index, prevPrice, timeframe }: { token: Token, index: number, prevPrice?: number, timeframe: '1h' | '24h' | '7d' }) => {
  // Determine flash direction
  let flashClass = '';
  if (prevPrice) {
    if (token.price_sol > prevPrice) flashClass = 'flash-up';
    else if (token.price_sol < prevPrice) flashClass = 'flash-down';
  }

  // Update prev price ref after render (side effect)
  const lastPriceRef = useRef(token.price_sol);

  useEffect(() => {
    lastPriceRef.current = token.price_sol;
  }, [token.price_sol]);

  const getChangeValue = () => {
    switch (timeframe) {
      case '1h': return token.price_1hr_change;
      case '24h': return token.price_24hr_change;
      case '7d': return token.price_7d_change;
      default: return token.price_24hr_change;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      layout
      className={`token-row ${flashClass}`}
      style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}
    >
      <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>{String(index).padStart(2, '0')}</span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${getRandomColor(token.token_ticker)} 0%, #333 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>
          {token.token_ticker[0]}
        </div>
        <div>
          <div style={{ fontWeight: 600 }}>{token.token_name}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{token.token_ticker}</div>
        </div>
      </div>

      <div style={{ fontFamily: 'monospace', fontWeight: 500 }}>
        {token.price_sol.toFixed(9)}
      </div>

      <ChangeCell value={getChangeValue()} />

      <div>
        {formatCompact(token.volume_sol)} SOL
      </div>

      <div>
        {formatCompact(token.market_cap_sol || 0)} SOL
      </div>

    </motion.div>
  );
};

// New ChangeCell component
const ChangeCell = ({ value }: { value: number }) => {
  const isPositive = value >= 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: isPositive ? 'var(--neon-green)' : 'var(--neon-pink)' }}>
      {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
      {Math.abs(value).toFixed(2)}%
    </div>
  );
};



// Utilities
function formatCompact(num: number) {
  return Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 2 }).format(num);
}

function getRandomColor(str: string) {
  const colors = ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];
  return colors[str.charCodeAt(0) % colors.length];
}

export default App;
