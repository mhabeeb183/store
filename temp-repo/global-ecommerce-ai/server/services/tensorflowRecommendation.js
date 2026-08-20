const tf = require("@tensorflow/tfjs");
const Product = require("../models/Product");
const Order = require("../models/Order");

/**
 * TensorFlow.js Content-Based Recommendation Engine
 * Uses product feature vectors and cosine similarity
 * to generate intelligent product recommendations.
 */

// Category encoding map (auto-built)
let categoryMap = {};
let brandMap = {};

const buildFeatureMaps = async () => {
  const products = await Product.find({});
  const categories = [...new Set(products.map((p) => p.category))];
  const brands = [...new Set(products.map((p) => p.brand || "unknown"))];

  categories.forEach((cat, i) => {
    categoryMap[cat] = i;
  });

  brands.forEach((brand, i) => {
    brandMap[brand] = i;
  });

  return { categoryCount: categories.length, brandCount: brands.length };
};

// Convert product to feature vector
const productToFeatureVector = (product, categoryCount, brandCount) => {
  // Category one-hot encoding
  const categoryVec = new Array(categoryCount).fill(0);
  const catIdx = categoryMap[product.category];
  if (catIdx !== undefined) categoryVec[catIdx] = 1;

  // Brand one-hot encoding
  const brandVec = new Array(brandCount).fill(0);
  const brandIdx = brandMap[product.brand || "unknown"];
  if (brandIdx !== undefined) brandVec[brandIdx] = 1;

  // Normalized numerical features
  const priceNorm = Math.min(product.price / 100000, 1);
  const ratingNorm = (product.averageRating || 0) / 5;
  const stockNorm = Math.min(product.stock / 1000, 1);
  const soldNorm = Math.min(product.soldCount / 1000, 1);

  return [...categoryVec, ...brandVec, priceNorm, ratingNorm, stockNorm, soldNorm];
};

// Compute cosine similarity using TensorFlow.js tensors
const cosineSimilarity = (vecA, vecB) => {
  const tensorA = tf.tensor1d(vecA);
  const tensorB = tf.tensor1d(vecB);

  const dotProduct = tf.sum(tf.mul(tensorA, tensorB));
  const normA = tf.norm(tensorA);
  const normB = tf.norm(tensorB);

  const similarity = dotProduct.div(normA.mul(normB).add(1e-8));
  const result = similarity.dataSync()[0];

  // Cleanup tensors
  tensorA.dispose();
  tensorB.dispose();
  dotProduct.dispose();
  normA.dispose();
  normB.dispose();
  similarity.dispose();

  return result;
};

// Get AI-powered recommendations for a product
const getAIRecommendations = async (productId, limit = 8) => {
  const { categoryCount, brandCount } = await buildFeatureMaps();

  const targetProduct = await Product.findById(productId);
  if (!targetProduct) return [];

  const allProducts = await Product.find({ _id: { $ne: productId } });

  const targetVector = productToFeatureVector(targetProduct, categoryCount, brandCount);

  // Calculate similarity scores for all products
  const scored = allProducts.map((product) => {
    const productVector = productToFeatureVector(product, categoryCount, brandCount);
    const similarity = cosineSimilarity(targetVector, productVector);
    return { product, similarity };
  });

  // Sort by similarity (highest first) and return top results
  scored.sort((a, b) => b.similarity - a.similarity);

  return scored.slice(0, limit).map((s) => ({
    ...s.product.toObject(),
    similarityScore: Math.round(s.similarity * 100) / 100,
  }));
};

// Get personalized recommendations based on user's order history
const getPersonalizedAIRecommendations = async (userId, limit = 10) => {
  const { categoryCount, brandCount } = await buildFeatureMaps();

  const orders = await Order.find({ user: userId }).populate("orderItems.product");

  // Build user preference vector from purchased products
  const purchasedProducts = [];
  orders.forEach((order) => {
    order.orderItems.forEach((item) => {
      if (item.product) purchasedProducts.push(item.product);
    });
  });

  if (purchasedProducts.length === 0) {
    // Cold start: return top-rated products
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

  // Normalize user profile
  userProfile.forEach((val, idx) => {
    userProfile[idx] = val / purchasedVectors.length;
  });

  // Find products not yet purchased
  const purchasedIds = new Set(purchasedProducts.map((p) => p._id.toString()));
  const candidateProducts = await Product.find({});
  const unpurchased = candidateProducts.filter(
    (p) => !purchasedIds.has(p._id.toString())
  );

  // Score candidates against user profile
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
};

module.exports = {
  getAIRecommendations,
  getPersonalizedAIRecommendations,
};
