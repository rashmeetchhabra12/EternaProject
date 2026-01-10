import redis from '../config/redis';

const memoryCache = new Map<string, any>();

export const cacheService = {
    async get<T>(key: string): Promise<T | null> {
        try {
            if (redis.status === 'ready') {
                const data = await redis.get(key);
                return data ? JSON.parse(data) : null;
            }
        } catch (e) {
            console.warn('Redis unreachable, using memory cache [GET]');
        }
        return memoryCache.get(key) || null;
    },

    async set(key: string, value: any, ttlSeconds: number = 30): Promise<void> {
        try {
            if (redis.status === 'ready') {
                await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
            }
        } catch (e) {
            console.warn('Redis unreachable, using memory cache [SET]');
        }
        memoryCache.set(key, value);
        // Simple TTL for memory cache (optional, or just leak for demo)
        setTimeout(() => memoryCache.delete(key), ttlSeconds * 1000);
    },

    async getKeys(pattern: string): Promise<string[]> {
        try {
            if (redis.status === 'ready') {
                return await redis.keys(pattern);
            }
        } catch (e) { }
        // Simple partial match for memory cache
        return Array.from(memoryCache.keys()).filter(k => k.includes(pattern.replace('*', '')));
    },

    async mget(keys: string[]): Promise<(string | null)[]> {
        if (keys.length === 0) return [];
        try {
            if (redis.status === 'ready') {
                return await redis.mget(keys);
            }
        } catch (e) { }

        return keys.map(k => {
            const val = memoryCache.get(k);
            return val ? JSON.stringify(val) : null;
        });
    }
};
