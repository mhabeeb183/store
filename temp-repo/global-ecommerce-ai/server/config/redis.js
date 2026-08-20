const { createClient } = require("redis");

let redisClient = null;

const connectRedis = async () => {
  // Track if we've already logged the error to avoid spam
  let errorLogged = false;

  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || "redis://localhost:6379",
      socket: {
        // Stop retrying after 1 failed attempt — Redis is optional
        reconnectStrategy: () => false,
        connectTimeout: 3000,
      },
    });

    // Only log the first error, suppress repeated connection noise
    redisClient.on("error", (err) => {
      if (!errorLogged) {
        errorLogged = true;
        console.warn("⚠️  Redis unavailable — running without cache:", err.code || err.message);
      }
    });

    redisClient.on("connect", () => {
      console.log("✅ Redis Connected Successfully");
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    if (!errorLogged) {
      console.warn("⚠️  Redis unavailable — app will continue without caching.");
    }
    redisClient = null;
    return null;
  }
};

const getRedisClient = () => redisClient;

module.exports = { connectRedis, getRedisClient };
