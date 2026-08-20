const { getRedisClient } = require("../config/redis");

const DEFAULT_TTL = 3600; // 1 hour

/**
 * Redis Cache Service
 * Provides caching layer for frequently accessed data
 */

const cacheGet = async (key) => {
  try {
    const client = getRedisClient();
    if (!client) return null;

    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Redis Cache Get Error:", error.message);
    return null;
  }
};

const cacheSet = async (key, value, ttl = DEFAULT_TTL) => {
  try {
    const client = getRedisClient();
    if (!client) return false;

    await client.setEx(key, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error("Redis Cache Set Error:", error.message);
    return false;
  }
};

const cacheDelete = async (key) => {
  try {
    const client = getRedisClient();
    if (!client) return false;

    await client.del(key);
    return true;
  } catch (error) {
    console.error("Redis Cache Delete Error:", error.message);
    return false;
  }
};

const cacheInvalidatePattern = async (pattern) => {
  try {
    const client = getRedisClient();
    if (!client) return false;

    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
    return true;
  } catch (error) {
    console.error("Redis Cache Invalidate Error:", error.message);
    return false;
  }
};

// Cache middleware for Express routes
const cacheMiddleware = (keyPrefix, ttl = DEFAULT_TTL) => {
  return async (req, res, next) => {
    const cacheKey = `${keyPrefix}:${req.originalUrl}`;
    const cached = await cacheGet(cacheKey);

    if (cached) {
      return res.json(cached);
    }

    // Override res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = async (data) => {
      await cacheSet(cacheKey, data, ttl);
      return originalJson(data);
    };

    next();
  };
};

module.exports = {
  cacheGet,
  cacheSet,
  cacheDelete,
  cacheInvalidatePattern,
  cacheMiddleware,
};
