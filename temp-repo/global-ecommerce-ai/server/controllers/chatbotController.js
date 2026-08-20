const jwt = require("jsonwebtoken");
const Product = require("../models/Product");
const Order = require("../models/Order");
const ChatLog = require("../models/ChatLog");

const chatbotSearch = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const text = message.toLowerCase().trim();
    const cleanText = text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").trim();

    // =========================
// BASIC AI CONVERSATION
// =========================

if (
  cleanText === "hi" ||
  cleanText === "hii" ||
  cleanText === "hello" ||
  cleanText === "hey"
) {
  return res.json({
    success: true,
    products: [],
    reply:
      "Hello 👋 I'm your AI Shopping Assistant. What product are you looking for today?",
  });
}

if (
  text.includes("how are you") ||
  text.includes("how r u") ||
  text.includes("how are u")
) {
  return res.json({
    success: true,
    products: [],
    reply:
      "I'm doing great 😊. I can help you find products, compare items, and recommend the best deals.",
  });
}

if (
  text.includes("your name") ||
  text.includes("who are you")
) {
  return res.json({
    success: true,
    products: [],
    reply:
      "I'm your AI Shopping Assistant 🤖 for the Global E-Commerce Ecosystem.",
  });
}

if (
  text.includes("thank") ||
  text.includes("thanks")
) {
  return res.json({
    success: true,
    products: [],
    reply:
      "You're welcome 😊 Happy shopping!",
  });
}
// =========================
// PERSONALIZED RECOMMENDATIONS
// =========================

if (
  text.includes("recommend something for me") ||
  text.includes("personalized recommendation") ||
  text.includes("recommend for me")
) {
  const userId =
  req.body.userId || null;

  if (!userId) {
    return res.json({
      success: true,
      products: [],
      reply:
        "Please login to get personalized recommendations.",
    });
  }

  const orders = await Order.find({
    user: userId,
  }).populate("orderItems.product");

  const categoryCount = {};

  orders.forEach((order) => {
    order.orderItems.forEach((item) => {
      if (item.product?.category) {
        const category =
          item.product.category;

        categoryCount[category] =
          (categoryCount[category] || 0) + 1;
      }
    });
  });

  const favoriteCategory =
    Object.keys(categoryCount).sort(
      (a, b) =>
        categoryCount[b] -
        categoryCount[a]
    )[0];

  const products = await Product.find({
    category: favoriteCategory,
  })
    .sort({ rating: -1 })
    .limit(10);

  return res.json({
    success: true,
    type: "personalized",
    favoriteCategory,
    products,
  });
}
    // =========================
// PRODUCT COMPARISON
// =========================

// =========================
// PRODUCT COMPARISON
// =========================

if (
  text.includes("compare") ||
  text.includes(" vs ")
) {
  const cleanedText = text
    .replace("compare", "")
    .replace("plz", "")
    .trim();

  const products = await Product.find();

  // Find products matching keywords in cleanedText
  let matchedProducts = products.filter((product) => {
    const name = product.name.toLowerCase();
    const brand = product.brand ? product.brand.toLowerCase() : "";
    const category = product.category ? product.category.toLowerCase() : "";

    // Direct matches
    if (cleanedText.includes(name)) return true;
    if (brand && cleanedText.includes(brand)) return true;
    if (category && cleanedText.includes(category)) return true;

    // Token-based keyword matching (words length > 3, filtering stop words)
    const stopWords = ["with", "wireless", "gaming", "mechanical", "noise", "cancelling"];
    const nameWords = name.split(/\s+/).filter(w => w.length > 3 && !stopWords.includes(w));
    if (nameWords.some(word => cleanedText.includes(word))) return true;

    return false;
  });

  // Fallback: If no explicit products matched, but general terms like "both", "them", "these", or "product" are used
  const isGeneralCompare = cleanedText.includes("both") || cleanedText.includes("them") || cleanedText.includes("these") || cleanedText.includes("product");
  if (matchedProducts.length < 2 && isGeneralCompare) {
    const { lastProductIds } = req.body;
    if (Array.isArray(lastProductIds) && lastProductIds.length >= 2) {
      // Find the specific products that were in the user's screen context!
      const lastProducts = await Product.find({ _id: { $in: lastProductIds } });
      if (lastProducts.length >= 2) {
        matchedProducts = lastProducts;
      }
    }

    // If still less than 2, fall back to top rated products in the catalog
    if (matchedProducts.length < 2) {
      const topRated = await Product.find({}).sort({ rating: -1 }).limit(2);
      if (topRated.length >= 2) {
        matchedProducts = topRated;
      }
    }
  }

  if (matchedProducts.length >= 2) {
    const first = matchedProducts[0];
    const second = matchedProducts[1];

    const firstScore =
      (first.rating || 0) * 100 -
      (first.price || 0) / 1000;

    const secondScore =
      (second.rating || 0) * 100 -
      (second.price || 0) / 1000;

    const recommendation =
      firstScore > secondScore
        ? first.name
        : second.name;

    return res.status(200).json({
      success: true,
      type: "comparison",
      recommendation,
      total: matchedProducts.length,
      products: matchedProducts,
    });
  }
  // If matchedProducts.length < 2, we fall through to let the Groq LLM or basic chat responses handle it dynamically.
}

    // =========================
    // BASIC CHAT RESPONSES
    // =========================

    if (
      text.includes("your name") ||
      text.includes("who are you")
    ) {
      return res.json({
        success: true,
        products: [],
        total: 0,
        reply:
          "I am your AI Shopping Assistant 🤖. I can help you find products and recommendations.",
      });
    }

    if (
      cleanText === "hi" ||
      cleanText === "hello" ||
      cleanText === "hey"
    ) {
      return res.json({
        success: true,
        products: [],
        total: 0,
        reply:
          "Hello 👋 What product are you looking for today?",
      });
    }

    if (
      text.includes("thanks") ||
      text.includes("thank you")
    ) {
      return res.json({
        success: true,
        products: [],
        total: 0,
        reply:
          "You're welcome 😊 Happy shopping!",
      });
    }

    // =========================
    // PRICE FILTER
    // =========================

    let finalQuery = {};

    const priceMatch =
      text.match(/under\s*₹?\s*(\d+)/i) ||
      text.match(/below\s*₹?\s*(\d+)/i) ||
      text.match(/less than\s*₹?\s*(\d+)/i);

    if (priceMatch) {
      finalQuery.price = {
        $lte: Number(priceMatch[1]),
      };
    }

    // =========================
    // SEARCH CONDITIONS
    // =========================

    const searchConditions = [];

    // Brands

    const brands = [
      "samsung",
      "apple",
      "iphone",
      "realme",
      "xiaomi",
      "oppo",
      "vivo",
      "oneplus",
      "hp",
      "dell",
      "lenovo",
      "asus",
      "puma",
      "nike",
      "adidas",
    ];

    brands.forEach((brand) => {
      if (text.includes(brand)) {
        searchConditions.push({
          brand: {
            $regex: brand,
            $options: "i",
          },
        });

        searchConditions.push({
          name: {
            $regex: brand,
            $options: "i",
          },
        });
      }
    });

    // Categories

    const categories = [
      "mobile",
      "phone",
      "smartphone",
      "laptop",
      "shoe",
      "shoes",
      "watch",
      "camera",
      "tv",
      "headphone",
      "headphones",
    ];

    categories.forEach((category) => {
      if (text.includes(category)) {
        searchConditions.push({
          category: {
            $regex: category,
            $options: "i",
          },
        });

        searchConditions.push({
          name: {
            $regex: category,
            $options: "i",
          },
        });
      }
    });

    // Product Name Search

    const words = text.split(" ");

    words.forEach((word) => {
      if (
        word.length > 2 &&
        ![
          "show",
          "find",
          "want",
          "buy",
          "under",
          "below",
          "good",
          "best",
          "top",
          "recommend",
          "suggest",
          "what",
          "where",
          "when",
          "which",
          "who",
          "product",
          "products",
          "item",
          "items",
          "trending",
          "trend",
        ].includes(word)
      ) {
        searchConditions.push({
          name: {
            $regex: word,
            $options: "i",
          },
        });
      }
    });

    if (searchConditions.length > 0) {
      finalQuery.$or = searchConditions;
    }

    console.log("Chatbot Query:", finalQuery);

    // =========================
    // COMMANDS
    // =========================

    let products = [];

    // Top Rated

    if (
      text.includes("top rated") ||
      text.includes("best") ||
      text.includes("recommend") ||
      text.includes("suggest")
    ) {
      products = await Product.find(finalQuery)
        .sort({ rating: -1 })
        .limit(10);
    }

    // Best Sellers

    else if (
      text.includes("best seller") ||
      text.includes("best sellers")
    ) {
      products = await Product.find(finalQuery)
        .sort({ sold: -1 })
        .limit(10);
    }

    // Low Stock

    else if (
      text.includes("low stock")
    ) {
      products = await Product.find({
        ...finalQuery,
        stock: { $lt: 10 },
      })
        .sort({ stock: 1 })
        .limit(10);
    }

    // Normal Search

    else {
      products = await Product.find(finalQuery)
        .limit(10);
    }

    let fallbackProducts = [];
    if (products.length === 0) {
      try {
        fallbackProducts = await Product.find({}).limit(5);
      } catch (dbErr) {
        console.error("Failed to fetch fallback products:", dbErr.message);
      }
    }

    let reply = "";
    if (process.env.GROQ_API_KEY) {
      try {
        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [
              {
                role: "system",
                content: "You are an AI Shopping Assistant for the Global E-Commerce Ecosystem. Help users find products, recommend items, and answer e-commerce questions in a friendly, conversational way. Keep responses to 2-3 sentences max. Do not use markdown formats that are complex to render (plain text or simple formatting with emojis is preferred)."
              },
              {
                role: "user",
                content: `User message: "${message}". Products matching search terms: ${JSON.stringify(products.map(p => ({ name: p.name, price: p.price, brand: p.brand, rating: p.rating })))}.${products.length === 0 ? ` (Note: No products directly matched the search terms, but here are some popular products currently available in our store: ${JSON.stringify(fallbackProducts.map(p => ({ name: p.name, price: p.price, brand: p.brand, rating: p.rating })))})` : ""}`
              }
            ]
          })
        });

        if (groqResponse.ok) {
          const groqData = await groqResponse.json();
          reply = groqData.choices?.[0]?.message?.content || "";
        } else {
          const errorBody = await groqResponse.text();
          console.error("Groq API error response status:", groqResponse.status, "Error:", errorBody);
        }
      } catch (err) {
        console.error("Groq API Call Error:", err);
      }
    }

    if (!reply) {
      reply = products.length > 0
        ? `I found ${products.length} products matching your query.`
        : "I couldn't find any products matching your search. Try searching for something else like 'laptop', 'iphone', or 'shoes'!";
    }

    // Save Chat to Database
    let finalUserId = null;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      try {
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        finalUserId = decoded.id;
      } catch (err) {
        console.error("JWT verification failed in chatbotSearch:", err.message);
      }
    }

    if (finalUserId) {
      try {
        let chatLog = await ChatLog.findOne({ user: finalUserId });
        if (!chatLog) {
          chatLog = new ChatLog({ user: finalUserId, messages: [] });
        }
        chatLog.messages.push({ sender: "user", text: message });
        chatLog.messages.push({ sender: "bot", text: reply });
        await chatLog.save();
      } catch (logErr) {
        console.error("Failed to save chat log:", logErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      userMessage: message,
      total: products.length,
      products,
      reply
    });
  } catch (error) {
    console.error("Chatbot Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getChatHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const chatLog = await ChatLog.findOne({ user: userId });
    res.json({
      success: true,
      messages: chatLog ? chatLog.messages : [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  chatbotSearch,
  getChatHistory,
};