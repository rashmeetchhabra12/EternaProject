import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
const redisHost = process.env.REDIS_HOST || '127.0.0.1';

console.log(`Connecting to Redis at ${redisHost}:${redisPort}`);

const redis = new Redis({
    port: redisPort,
    host: redisHost,
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
});

redis.on('connect', () => {
    console.log('Successfully connected to Redis');
});

redis.on('error', (err) => {
    console.error('Redis connection error:', err);
});

export default redis;
