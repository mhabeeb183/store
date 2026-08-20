const crypto = require("crypto");

/**
 * Service to retrieve or generate ICE servers (STUN/TURN) configurations.
 * Handles self-hosted Coturn time-limited credentials,
 * Metered.ca cloud endpoints, Xirsys endpoints, or returns standard fallbacks.
 */
const getProductionIceServers = async () => {
  const iceServers = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ];

  // 1. Coturn Self-Hosted (HMAC dynamic credentials generation)
  if (process.env.COTURN_URL && process.env.COTURN_SECRET) {
    try {
      const username = process.env.COTURN_USERNAME || "ecom-live";
      const secret = process.env.COTURN_SECRET;
      const turnUrl = process.env.COTURN_URL;

      // 24 hours expiry
      const unixTimeStamp = Math.floor(Date.now() / 1000) + 24 * 3600;
      const credentialUsername = `${unixTimeStamp}:${username}`;

      const hmac = crypto.createHmac("sha1", secret);
      hmac.update(credentialUsername);
      const credential = hmac.digest("base64");

      iceServers.push({
        urls: turnUrl,
        username: credentialUsername,
        credential: credential,
      });

      console.log("⚡ Generated Coturn TURN credentials dynamically.");
      return iceServers;
    } catch (err) {
      console.warn("Failed to generate Coturn credentials, falling back.", err.message);
    }
  }

  // 2. Metered.ca API Integration
  if (process.env.METERED_API_KEY) {
    try {
      const response = await fetch(
        `https://ecommerce-system.metered.live/api/v1/turn/credentials?apiKey=${process.env.METERED_API_KEY}`
      );
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          console.log("⚡ Fetched TURN credentials from Metered.ca cloud service.");
          return [...iceServers, ...data];
        }
      }
    } catch (err) {
      console.warn("Failed to retrieve TURN credentials from Metered.ca", err.message);
    }
  }

  // 3. Xirsys API Integration
  if (process.env.XIRSYS_SECRET_KEY && process.env.XIRSYS_USERNAME && process.env.XIRSYS_CHANNEL) {
    try {
      const auth = Buffer.from(
        `${process.env.XIRSYS_USERNAME}:${process.env.XIRSYS_SECRET_KEY}`
      ).toString("base64");
      
      const response = await fetch("https://global.xirsys.net/_turn/" + process.env.XIRSYS_CHANNEL, {
        method: "PUT",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.v && data.v.iceServers) {
          console.log("⚡ Fetched TURN credentials from Xirsys cloud service.");
          return [...iceServers, ...data.v.iceServers];
        }
      }
    } catch (err) {
      console.warn("Failed to retrieve TURN credentials from Xirsys", err.message);
    }
  }

  // 4. Default public fallback (for developer sandbox/local usage)
  console.log("⚡ Using public OpenRelay fallback server config.");
  iceServers.push(
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    }
  );

  return iceServers;
};

module.exports = { getProductionIceServers };
