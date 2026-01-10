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
      <header style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              padding: '0.75rem',
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(168, 85, 247, 0.2))',
              borderRadius: '16px',
              boxShadow: '0 0 30px rgba(6, 182, 212, 0.3)'
            }}>
              <Activity size={36} color="var(--neon-cyan)" />
            </div>
            <div>
              <h1>Eterna<span style={{ color: 'var(--neon-cyan)' }}>Flow</span></h1>
              <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 500 }}>
                Real-time Meme Coin Analytics
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Live Status Card */}
            <div className="glass-panel" style={{
              padding: '0.875rem 1.5rem',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: connected ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(6, 182, 212, 0.05))' : 'rgba(255,255,255,0.03)'
            }}>
              <div className={connected ? 'pulse-glow' : ''} style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: connected ? 'var(--neon-green)' : 'var(--neon-pink)',
                boxShadow: connected ? '0 0 15px var(--neon-green)' : '0 0 15px var(--neon-pink)'
              }}></div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Status</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: connected ? 'var(--neon-green)' : 'var(--text-muted)' }}>
                  {connected ? 'Live' : 'Connecting...'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Controls Row */}
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '2rem' }}>
          {/* Search Bar */}
          <div style={{ flex: 1, maxWidth: '600px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search tokens by name or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '1.125rem 1.75rem',
                paddingLeft: '3.5rem',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
                border: '1px solid var(--glass-border)',
                borderRadius: '16px',
                color: 'white',
                fontSize: '1rem',
                backdropFilter: 'blur(10px)',
                outline: 'none',
                transition: 'all 0.3s',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
              }}
            />
            <div style={{
              position: 'absolute',
              left: '1.25rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--neon-cyan)',
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(168, 85, 247, 0.1))',
              padding: '0.5rem',
              borderRadius: '8px'
            }}>
              <Zap size={18} />
            </div>
          </div>

          {/* Sort Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)' }}>Sort:</span>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="glass-panel"
                style={{
                  padding: '1rem 1.5rem',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
                  color: 'var(--text-main)',
                  border: '1px solid var(--glass-border)',
                  outline: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  minWidth: '180px',
                  justifyContent: 'space-between',
                  fontWeight: 600,
                  fontSize: '0.9rem'
                }}
              >
                {sortOptions.find(o => o.value === sortBy)?.label}
                <ArrowDownRight size={16} style={{ transform: isSortOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s', color: 'var(--neon-cyan)' }} />
              </button>

              {isSortOpen && (
                <div className="glass-panel" style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  width: '100%',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(26, 20, 67, 0.98))',
                  border: '1px solid var(--glass-border)',
                  padding: '0.5rem',
                  zIndex: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                  boxShadow: '0 20px 60px -12px rgba(0, 0, 0, 0.7)',
                  backdropFilter: 'blur(20px)'
                }}>
                  {sortOptions.map(opt => (
                    <div
                      key={opt.value}
                      onClick={() => {
                        setSortBy(opt.value);
                        setIsSortOpen(false);
                      }}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        background: sortBy === opt.value ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(168, 85, 247, 0.1))' : 'transparent',
                        color: sortBy === opt.value ? 'var(--neon-cyan)' : 'var(--text-muted)',
                        transition: 'all 0.2s',
                        fontWeight: sortBy === opt.value ? 700 : 600,
                        borderLeft: sortBy === opt.value ? '3px solid var(--neon-cyan)' : '3px solid transparent'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--text-main)';
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = sortBy === opt.value ? 'var(--neon-cyan)' : 'var(--text-muted)';
                        e.currentTarget.style.background = sortBy === opt.value ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(168, 85, 247, 0.1))' : 'transparent';
                      }}
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Timeframe Selector */}
          <div className="glass-panel" style={{ padding: '0.375rem', borderRadius: '14px', display: 'flex', gap: '0.375rem', background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))' }}>
            {(['1h', '24h', '7d'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setSelectedTimeframe(tf)}
                style={{
                  padding: '0.75rem 1.25rem',
                  borderRadius: '10px',
                  background: selectedTimeframe === tf ? 'linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))' : 'transparent',
                  color: selectedTimeframe === tf ? 'white' : 'var(--text-muted)',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: selectedTimeframe === tf ? 700 : 600,
                  fontSize: '0.875rem',
                  transition: 'all 0.3s',
                  boxShadow: selectedTimeframe === tf ? '0 4px 15px rgba(6, 182, 212, 0.4)' : 'none'
                }}
              >
                {tf.toUpperCase()}
              </button>
            ))}
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
                      index={(page - 1) * PAGE_LIMIT + index + 1}
                      prevPrice={prevPrices.current[token.token_address]}
                      timeframe={selectedTimeframe}
                    />
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No tokens found for "{debouncedQuery}"</div>
                )}

                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '1rem',
                  marginTop: '2.5rem',
                  padding: '1.5rem'
                }}>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                    className="glass-panel"
                    style={{
                      padding: '0.875rem 1.75rem',
                      borderRadius: '14px',
                      background: page === 1 ? 'transparent' : 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(168, 85, 247, 0.1))',
                      color: page === 1 ? 'var(--text-muted)' : 'var(--neon-cyan)',
                      border: `1px solid ${page === 1 ? 'transparent' : 'var(--glass-border)'}`,
                      cursor: page === 1 ? 'not-allowed' : 'pointer',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      transition: 'all 0.3s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <ArrowDownRight size={16} style={{ transform: 'rotate(90deg)' }} />
                    Previous
                  </button>

                  <div className="glass-panel" style={{
                    padding: '0.875rem 2rem',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(168, 85, 247, 0.15))',
                    border: '2px solid var(--neon-cyan)',
                    boxShadow: '0 0 25px rgba(6, 182, 212, 0.3)'
                  }}>
                    <span style={{
                      fontWeight: 800,
                      color: 'var(--neon-cyan)',
                      fontFamily: 'monospace',
                      fontSize: '1.1rem',
                      textShadow: '0 0 10px rgba(6, 182, 212, 0.5)'
                    }}>
                      Page {page}
                    </span>
                  </div>

                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={!hasMore || loading}
                    className="glass-panel"
                    style={{
                      padding: '0.875rem 1.75rem',
                      borderRadius: '14px',
                      background: !hasMore ? 'transparent' : 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(168, 85, 247, 0.1))',
                      color: !hasMore ? 'var(--text-muted)' : 'var(--neon-cyan)',
                      border: `1px solid ${!hasMore ? 'transparent' : 'var(--glass-border)'}`,
                      cursor: !hasMore ? 'not-allowed' : 'pointer',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      transition: 'all 0.3s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    Next
                    <ArrowDownRight size={16} style={{ transform: 'rotate(-90deg)' }} />
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
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '40px'
      }}>
        <span style={{
          color: 'var(--neon-cyan)',
          fontFamily: 'monospace',
          fontSize: '0.95rem',
          fontWeight: 700,
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(168, 85, 247, 0.1))',
          padding: '0.375rem 0.75rem',
          borderRadius: '8px',
          border: '1px solid rgba(6, 182, 212, 0.3)'
        }}>
          {String(index).padStart(2, '0')}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        <div style={{
          width: 42,
          height: 42,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${getRandomColor(token.token_ticker)} 0%, ${getSecondaryColor(token.token_ticker)} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1rem',
          fontWeight: 900,
          boxShadow: `0 0 20px ${getRandomColor(token.token_ticker)}40`,
          border: '2px solid rgba(255,255,255,0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <span style={{ position: 'relative', zIndex: 1 }}>{token.token_ticker[0]}</span>
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), transparent)',
            pointerEvents: 'none'
          }}></div>
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.01em' }}>{token.token_name}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{token.token_ticker}</div>
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
  const colors = ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#06b6d4', '#a855f7'];
  return colors[str.charCodeAt(0) % colors.length];
}

function getSecondaryColor(str: string) {
  const colors = ['#f472b6', '#a78bfa', '#60a5fa', '#34d399', '#fbbf24', '#22d3ee', '#c084fc'];
  return colors[str.charCodeAt(0) % colors.length];
}

export default App;
