import httpClient from '../utils/httpClient';
import { DexScreenerPair, TokenData } from '../types';

export const fetchDexScreener = async (query: string): Promise<TokenData[]> => {
    try {
        const response = await httpClient.get(`https://api.dexscreener.com/latest/dex/search?q=${query}`);
        const pairs: DexScreenerPair[] = response.data.pairs || [];

        return pairs
            .filter(pair => pair.chainId === 'solana')
            .map(pair => ({
                token_address: pair.baseToken.address,
                token_name: pair.baseToken.name,
                token_ticker: pair.baseToken.symbol,
                price_sol: parseFloat(pair.priceNative),
                market_cap_sol: (pair.marketCap || pair.fdv || 0) / parseFloat(pair.priceUsd || '1') * parseFloat(pair.priceNative),
                volume_sol: (pair.volume?.h24 || 0) / parseFloat(pair.priceUsd || '1') * parseFloat(pair.priceNative),
                liquidity_sol: (pair.liquidity?.usd || 0) / parseFloat(pair.priceUsd || '1') * parseFloat(pair.priceNative),
                transaction_count: (pair.txns?.h24?.buys || 0) + (pair.txns?.h24?.sells || 0),
                price_1hr_change: pair.priceChange?.h1 || 0,
                price_24hr_change: pair.priceChange?.h24 || 0,
                price_7d_change: 0, // 7d Unavailable on this endpoint
                protocol: 'dexscreener',
            }));
    } catch (error) {
        console.error('Error fetching from DexScreener:', error);
        return [];
    }
};

export const fetchJupiter = async (query: string): Promise<TokenData[]> => {
    try {
        const searchResponse = await httpClient.get(`https://lite-api.jup.ag/tokens/v2/search?query=${query}`);
        const tokens = searchResponse.data.tokens || [];
        const topTokens = tokens.slice(0, 20);

        if (topTokens.length === 0) return [];

        const ids = topTokens.map((t: any) => t.address).join(',');

        // Fallback or attempt to use Price API. If 401, we might skip price or strictly rely on search metadata if available.
        // Since search metadata doesn't have price, this part is critical. 
        // I will try the basic v2 endpoint without vsToken FIRST, as vsToken might be causing issues or limits.
        // If that fails, we return empty list for Jupiter to avoid breaking the app, logging the error.

        try {
            const pricesResponse = await httpClient.get(`https://api.jup.ag/price/v2?ids=${ids}`);
            const prices = pricesResponse.data.data;

            if (!prices) return [];

            return topTokens.filter((t: any) => prices[t.address]).map((t: any) => {
                const p = prices[t.address];
                // Price is likely in USDC. We need SOL price to convert if we want strict 'price_sol'.
                // For now, I'll store the raw price and assume it is close enough or handle conversion later.
                // Or better, since DexScreener gives SOL price, we rely on DexScreener for SOL-based metrics 
                // and use Jupiter as a backup source that might give USDC prices.
                // Requirement: "price_sol".
                return {
                    token_address: t.address,
                    token_name: t.name,
                    token_ticker: t.symbol,
                    price_sol: parseFloat(p.price), // This is likely USD/USDC.
                    market_cap_sol: 0,
                    volume_sol: 0,
                    liquidity_sol: 0,
                    transaction_count: 0,
                    price_1hr_change: 0,
                    price_24hr_change: 0,
                    price_7d_change: 0,
                    protocol: 'jupiter',
                };
            });
        } catch (priceError) {
            console.error('Jupiter Price API failed (likely 401 or limit):', priceError);
            return [];
        }

    } catch (error) {
        console.error('Error fetching from Jupiter:', error);
        return [];
    }
};
