import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

let redisClient = null;
let redisConnected = false;

const initRedis = async () => {
  const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
  
  try {
    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            console.warn("Redis reconnection attempts exhausted. Disabling cache fallback.");
            return new Error("Connection lost");
          }
          return 1000; // reconnect after 1s
        }
      }
    });

    redisClient.on("error", (err) => {
      console.warn("Redis Client Error:", err.message);
      redisConnected = false;
    });

    redisClient.on("connect", () => {
      console.log("Redis Client: Connected successfully!");
      redisConnected = true;
    });

    await redisClient.connect();
  } catch (err) {
    console.warn("Could not connect to Redis. Running app with cache-bypass fallback.", err.message);
    redisClient = null;
    redisConnected = false;
  }
};

// Auto-run initialization
await initRedis();

export const getRedisClient = () => redisClient;
export const isRedisConnected = () => redisConnected;
