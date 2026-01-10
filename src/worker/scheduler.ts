import cron from 'node-cron';
import { fetchDexScreener, fetchJupiter } from '../services/fetcher';
import { mergeTokens } from '../services/aggregator';
import { cacheService } from '../services/cache';
import { Server } from 'socket.io';

export const startScheduler = (io: Server) => {
    // Poll every 15 seconds
    cron.schedule('*/15 * * * * *', async () => {
        console.log('Running background job: Fetching and aggregating tokens...');
        try {
            // Fetch concurrently
            // Expanded query list for "Trending" simulation
            const queries = ['SOL', 'BONK', 'WIF', 'JUP', 'RAY', 'POPCAT', 'MEW'];
            const results = await Promise.all([
                ...queries.map(q => fetchDexScreener(q)),
                fetchJupiter('SOL')
            ]);

            // Flatten DexScreener results
            const dexTokens = results.slice(0, queries.length).flat() as any[]; // cast to avoid type issues if strict
            const jupTokens = results[queries.length] as any[];

            // Dedup DexTokens
            const uniqueDexTokens = Array.from(new Map(dexTokens.map(t => [t.token_address, t])).values());

            const aggregatedData = mergeTokens(uniqueDexTokens, jupTokens);

            // Cache individual tokens AND the list?
            // Requirement: "All REST API requests must check Redis first."
            // Let's store the full list for the simple GET /tokens endpoint, 
            // and maybe individual tokens if we had detail pages (not required explicitly but good practice).

            // Store list for simple retrieval
            // We might want to store as a sorted set for easier pagination/sorting in Redis directly?
            // Or just a big JSON blob for simplicity if list isn't huge.
            // Given: "Pagination: Implement cursor-based pagination... large lists".
            // If the list is large, JSON blob is bad. Sorted Set (ZSET) is best.

            // However, ZSET only stores score + member (string).
            // We need to store the full object.
            // Common pattern: Store ID in ZSET, Object in Hash or String Key.
            // Given the complexity of "sort by volume, price_change, market_cap", 
            // we might need multiple ZSETs or just sort in memory if the dataset is small (< 1000).
            // DexScreener search returns limited results (~30 pairs). Jupiter ~50. 
            // Total < 100 items. Memory sort is fine effectively.

            // Optimization: Store the aggregated list as a single key for now, 
            // or key "tokens:all".

            await cacheService.set('tokens:all', aggregatedData, 30);

            // Also update individual keys if needed, e.g. "token:{address}"
            const pipeline = (await import('../config/redis')).default.pipeline();
            aggregatedData.forEach(token => {
                pipeline.set(`token:${token.token_address}`, JSON.stringify(token), 'EX', 60);
            });
            await pipeline.exec();

            // Broadcast updates via WebSockets
            io.emit('price-update', aggregatedData);

            console.log(`Updated ${aggregatedData.length} tokens.`);

        } catch (error) {
            console.error('Error in background job:', error);
        }
    });
};
