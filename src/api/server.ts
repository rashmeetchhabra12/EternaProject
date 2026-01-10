import express from 'express';
import cors from 'cors';
import { getTokens } from './tokenController';
import { app, httpServer, io } from '../websocket/socketServer';
import { startScheduler } from '../worker/scheduler';

app.use(cors());
app.use(express.json());

// Routes
app.get('/tokens', getTokens);

// Start Scheduler
startScheduler(io);

// Initial fetch
import { fetchDexScreener, fetchJupiter } from '../services/fetcher';
import { mergeTokens } from '../services/aggregator';
import { cacheService } from '../services/cache';

(async () => {
    console.log('Running initial fetch...');
    try {
        const [dexData, jupData] = await Promise.all([
            fetchDexScreener('SOL'),
            fetchJupiter('SOL')
        ]);
        const aggregatedData = mergeTokens(dexData, jupData);
        await cacheService.set('tokens:all', aggregatedData, 30);
        console.log(`Initial fetch complete: ${aggregatedData.length} tokens.`);
    } catch (e) {
        console.error('Initial fetch failed:', e);
    }
})();

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
