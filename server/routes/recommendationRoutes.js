const express = require("express");
const router = express.Router();

const { GoogleGenAI } = require("@google/genai");
const Crop = require("../models/Crop");

const ai = new GoogleGenAI({
apiKey: process.env.GEMINI_API_KEY,
});

// ------------------------------------------
// RESPONSE CACHE
// ------------------------------------------

const recommendationCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000;

// Temporarily stop Gemini calls after quota/server errors.
let geminiCooldownUntil = 0;

// ------------------------------------------
// SEARCH KEYWORD MAPPING
// ------------------------------------------

const keywordGroups = {
salad: ["tomato", "cucumber", "onion", "spinach", "lettuce", "carrot"],
juice: ["apple", "orange", "mango", "banana", "fruit"],
smoothie: ["banana", "mango", "apple", "fruit"],
fruits: ["fruit", "apple", "banana", "mango", "orange"],
vegetables: ["vegetable", "tomato", "potato", "onion", "spinach"],
cooking: ["potato", "tomato", "onion", "spinach"],
healthy: ["spinach", "fruit", "vegetable", "carrot"],
};

const ignoredWords = [
"the", "and", "for", "with", "can", "you",
"suggest", "recommend", "find", "some", "want",
"need", "show", "give", "fresh", "please",
"me", "my", "what", "are", "is", "how",
"much", "many", "available", "product",
"products", "from", "our", "your", "get",
];

// ------------------------------------------
// DATABASE FALLBACK RECOMMENDATIONS
// ------------------------------------------

async function getFallbackRecommendations(message) {
const words = message
.toLowerCase()
.split(/[^a-z0-9]+/)
.filter((word) => word.length > 2);

const searchWords = new Set();

words.forEach((word) => {
if (!ignoredWords.includes(word)) {
searchWords.add(word);
}

if (keywordGroups[word]) {
  keywordGroups[word].forEach((item) =>
    searchWords.add(item)
  );
}

});

const usefulKeywords = [...searchWords];

const availableFilter = {
quantity: { $gt: 0 },
};

let products;

if (usefulKeywords.length === 0) {
products = await Crop.find(availableFilter)
.select("name category price quantity location description imageUrl")
.limit(5)
.lean();
} else {
const searchConditions = usefulKeywords.flatMap((word) => [
{ name: { $regex: word, $options: "i" } },
{ category: { $regex: word, $options: "i" } },
{ description: { $regex: word, $options: "i" } },
]);

products = await Crop.find({
  ...availableFilter,
  $or: searchConditions,
})
  .select("name category price quantity location description imageUrl")
  .limit(5)
  .lean();
}

return products;
}

// ------------------------------------------
// RECOMMENDATION API
// ------------------------------------------

router.post("/", async (req, res) => {
try {
const { message } = req.body;

if (
  !message ||
  typeof message !== "string" ||
  !message.trim()
) {
  return res.status(400).json({
    success: false,
    reply: "Please enter what you are looking for.",
    products: [],
  });
}

if (message.length > 1000) {
  return res.status(400).json({
    success: false,
    reply: "Please keep your request under 1000 characters.",
    products: [],
  });
}

const cleanMessage = message.trim();
const cacheKey = cleanMessage.toLowerCase();

// Check cache
const cached = recommendationCache.get(cacheKey);

if (
  cached &&
  Date.now() - cached.time < CACHE_DURATION
) {
  return res.json({
    ...cached.data,
    cached: true,
  });
}

// Fetch available products
const crops = await Crop.find({
  quantity: { $gt: 0 },
})
  .select("name category price quantity location description imageUrl")
  .limit(100)
  .lean();

if (crops.length === 0) {
  return res.json({
    success: true,
    fallback: false,
    reply: "Sorry! No products are currently available.",
    products: [],
  });
}

let result;
let fallback = false;

// ------------------------------------------
// GEMINI RECOMMENDATIONS
// ------------------------------------------

if (
  process.env.GEMINI_API_KEY &&
  Date.now() >= geminiCooldownUntil
) {
  try {
    const productContext = crops.map((crop) => ({
      id: crop._id.toString(),
      name: crop.name,
      category: crop.category,
      price: crop.price,
      quantity: crop.quantity,
      location: crop.location,
      description: crop.description || "",
    }));

    const prompt = `

You are GraminConnect's shopping recommendation assistant.

Customer request:
${cleanMessage}

Available products:
${JSON.stringify(productContext)}

Rules:

1. Recommend only products from this database.
2. Never invent prices, quantities or locations.
3. Recommend up to 5 relevant products.
4. Explain briefly why the products match.
5. If nothing matches, say so honestly.
6. Reply in simple English or Hinglish.
7. Return valid JSON only.

Format:
{
"reply": "Your recommendation message",
"productIds": ["database_id_1"]
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
    });

    const rawText = response.text || "";

    const cleanedText = rawText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    result = JSON.parse(cleanedText);

    const recommendedIds = Array.isArray(result.productIds)
      ? result.productIds.slice(0, 5)
      : [];

    const recommendedProducts = crops.filter((crop) =>
      recommendedIds.includes(crop._id.toString())
    );

    const data = {
      success: true,
      fallback: false,
      reply:
        result.reply ||
        "Here are some products you may like! 🌱",
      products: recommendedProducts,
    };

    recommendationCache.set(cacheKey, {
      data,
      time: Date.now(),
    });

    return res.json(data);

  } catch (error) {
    const errorMessage = error.message || "";

    console.error(
      "Gemini Recommendation Error:",
      errorMessage
    );

    if (
      errorMessage.includes("429") ||
      errorMessage.includes("RESOURCE_EXHAUSTED") ||
      errorMessage.includes("503") ||
      errorMessage.includes("UNAVAILABLE")
    ) {
      // Avoid repeatedly calling an unavailable API.
      geminiCooldownUntil = Date.now() + 60 * 60 * 1000;
    }
  }
}

// ------------------------------------------
// MONGODB FALLBACK
// ------------------------------------------

fallback = true;

const fallbackProducts =
  await getFallbackRecommendations(cleanMessage);

result = {
  success: true,
  fallback,
  reply:
    fallbackProducts.length > 0
      ? "Gemini is temporarily unavailable, but I found these matching products for you! 🌱"
      : "I couldn't find matching products. Try searching for vegetables, fruits or a specific crop.",
  products: fallbackProducts,
};

recommendationCache.set(cacheKey, {
  data: result,
  time: Date.now(),
});

// Keep cache size manageable.
if (recommendationCache.size > 200) {
  const oldestKey = recommendationCache.keys().next().value;
  recommendationCache.delete(oldestKey);
}

return res.json(result);

} catch (error) {
console.error(
"Recommendation Route Error:",
error.message
);

return res.status(500).json({
  success: false,
  reply: "Sorry! Recommendations are temporarily unavailable.",
  products: [],
});

}
});

module.exports = router;
