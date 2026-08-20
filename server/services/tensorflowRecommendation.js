import Product from "../models/Product.js";
import Order from "../models/Order.js";

// Category encoding maps
let categoryMap = {};
let brandMap = {};

const buildFeatureMaps = async () => {
  const products = await Product.find({});
  const categories = [...new Set(products.map((p) => p.category || "Grocery"))];
  const brands = [...new Set(products.map((p) => p.brand || "Fresh"))];

  categories.forEach((cat, i) => {
    categoryMap[cat] = i;
  });

  brands.forEach((brand, i) => {
    brandMap[brand] = i;
  });

  return { categoryCount: categories.length, brandCount: brands.length };
};

// Helper to convert product price to float number for calculation
const getNumericPrice = (priceVal) => {
  if (typeof priceVal === "number") return priceVal;
  if (typeof priceVal === "string") {
    const cleaned = priceVal.replace("RS ", "").trim();
    return parseFloat(cleaned) || 0;
  }
  return 0;
};

// Convert product to feature vector
const productToFeatureVector = (product, categoryCount, brandCount) => {
  // Category one-hot encoding
  const categoryVec = new Array(categoryCount).fill(0);
  const catIdx = categoryMap[product.category || "Grocery"];
  if (catIdx !== undefined) categoryVec[catIdx] = 1;

  // Brand one-hot encoding
  const brandVec = new Array(brandCount).fill(0);
  const brandIdx = brandMap[product.brand || "Fresh"];
  if (brandIdx !== undefined) brandVec[brandIdx] = 1;

  // Normalized numerical features
  const priceNorm = Math.min(getNumericPrice(product.price) / 1000, 1); // normalized around max 1000 RS
  const ratingNorm = (product.averageRating || 4.5) / 5;
  const stockNorm = Math.min((product.stock || 100) / 1000, 1);
  const soldNorm = Math.min((product.soldCount || 0) / 1000, 1);

  return [...categoryVec, ...brandVec, priceNorm, ratingNorm, stockNorm, soldNorm];
};

// Compute cosine similarity using pure JS numbers
const cosineSimilarity = (vecA, vecB) => {
  if (vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  return dotProduct / (normA * normB + 1e-8);
};

// Get AI-powered recommendations for a product
export const getAIRecommendations = async (productId, limit = 8) => {
  try {
    const { categoryCount, brandCount } = await buildFeatureMaps();

    const targetProduct = await Product.findById(productId);
    if (!targetProduct) return [];

    const allProducts = await Product.find({ _id: { $ne: productId } });
    const targetVector = productToFeatureVector(targetProduct, categoryCount, brandCount);

    const scored = allProducts.map((product) => {
      const productVector = productToFeatureVector(product, categoryCount, brandCount);
      const similarity = cosineSimilarity(targetVector, productVector);
      return { product, similarity };
    });

    scored.sort((a, b) => b.similarity - a.similarity);

    return scored.slice(0, limit).map((s) => ({
      ...s.product.toObject(),
      similarityScore: Math.round(s.similarity * 100) / 100,
    }));
  } catch (error) {
    console.error("AI Recommendations Error:", error);
    return [];
  }
};

// Get personalized recommendations based on user's order history
export const getPersonalizedAIRecommendations = async (userId, limit = 10) => {
  try {
    const { categoryCount, brandCount } = await buildFeatureMaps();

    // Fetch user's orders
    const orders = await Order.find({ userId: userId });
    
    // Extract purchased product names
    const purchasedProductNames = orders.flatMap((o) => o.items.map((i) => i.name.toLowerCase()));

    // Get all products to build user preference profile
    const allProducts = await Product.find({});
    
    // Find products actually purchased in product catalog (by name match)
    const purchasedProducts = allProducts.filter((p) => 
      purchasedProductNames.includes(p.name.toLowerCase())
    );

    if (purchasedProducts.length === 0) {
      // Cold start: return top-rated/popular products in catalog
      return await Product.find({}).sort({ averageRating: -1 }).limit(limit);
    }

    // Average the feature vectors of purchased products to create user profile
    const purchasedVectors = purchasedProducts.map((p) =>
      productToFeatureVector(p, categoryCount, brandCount)
    );

    const vectorLength = purchasedVectors[0].length;
    const userProfile = new Array(vectorLength).fill(0);

    purchasedVectors.forEach((vec) => {
      vec.forEach((val, idx) => {
        userProfile[idx] += val;
      });
    });

    userProfile.forEach((val, idx) => {
      userProfile[idx] = val / purchasedVectors.length;
    });

    // Find candidate products (exclude those already purchased)
    const unpurchased = allProducts.filter(
      (p) => !purchasedProductNames.includes(p.name.toLowerCase())
    );

    const scored = unpurchased.map((product) => {
      const productVector = productToFeatureVector(product, categoryCount, brandCount);
      const similarity = cosineSimilarity(userProfile, productVector);
      return { product, similarity };
    });

    scored.sort((a, b) => b.similarity - a.similarity);

    return scored.slice(0, limit).map((s) => ({
      ...s.product.toObject(),
      aiScore: Math.round(s.similarity * 100) / 100,
    }));
  } catch (error) {
    console.error("Personalized Recommendations Error:", error);
    // Fallback: return default catalog items
    return await Product.find({}).limit(limit);
  }
};
