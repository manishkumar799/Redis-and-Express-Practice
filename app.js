const express = require('express');
const redis = require('redis');

const app = express();
const PORT = process.env.PORT || 3000;

// Create a Redis client
const redisClient = redis.createClient({
    url: 'redis://localhost:6379' // This is the default Redis URL
});
redisClient.connect();

redisClient.on('error', (err) => console.log('Redis Client Error', err));

// Middleware to log requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} request to ${req.url}`);
    next();
});

// Basic route with Redis caching
app.get('/data', async (req, res) => {
    const cacheKey = 'storedData';
    try {
        // Try to fetch the data from Redis cache
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            console.log('Fetching from cache');
            return res.send({ data: JSON.parse(cachedData), source: 'cache' });
        }

        // Simulate data fetching and processing
        const newData = { time: new Date().toISOString(), details: "This is some data" };
        console.log('Setting data to cache');
        
        // Store the data in Redis cache with an expiry time (e.g., 10 seconds)
        await redisClient.set(cacheKey, JSON.stringify(newData), {
            EX: 10
        });

        res.send({ data: newData, source: 'api' });
    } catch (error) {
        res.status(500).json({ error: "Error fetching data" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
