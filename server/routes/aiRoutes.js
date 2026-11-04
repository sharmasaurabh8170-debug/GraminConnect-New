const express = require("express");
const router = express.Router();
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
apiKey: process.env.GEMINI_API_KEY,
});

// Temporary in-memory response cache
const responseCache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Simple fallback responses
function getFallbackReply(message, role) {
const text = message.toLowerCase();

if (text.includes("organic farming")) {
return "Organic farming is a method of growing crops using natural materials like compost and manure instead of synthetic fertilizers and pesticides. It focuses on maintaining healthy soil and protecting the environment. 🌱";
}

if (text.includes("soil")) {
return "Healthy soil is important for good crop production. Farmers can improve soil health through compost, crop rotation, proper irrigation and soil testing.";
}

if (text.includes("water") || text.includes("irrigation")) {
return "Proper irrigation helps crops grow well. Farmers should water crops according to their needs and avoid both overwatering and underwatering.";
}

if (text.includes("fertilizer") || text.includes("manure")) {
return "Compost and well-decomposed manure can improve soil health. Choose fertilizers according to soil-test results and crop requirements.";
}

if (text.includes("crop listing") || text.includes("product listing")) {
return "To create a good crop listing, add a clear product name, accurate price, available quantity, location, a fresh product photograph and an honest description.";
}

if (text.includes("storage") || text.includes("store")) {
return "Store fruits and vegetables according to their individual temperature and moisture requirements. Remove damaged produce and keep storage areas clean and ventilated.";
}

if (role === "farmer") {
return "I'm temporarily using my offline farming assistant. 🌱 You can improve your crop listing with clear photos, accurate prices, available quantities and location details. Please try your question again after some time for a Gemini response.";
}

return "I'm temporarily using my offline assistant. 🌱 You can explore available products in GraminConnect or ask me about farming, vegetables, fruits and product listings. Gemini will be available again when your API quota resets.";
}

router.post("/chat", async (req, res) => {
const { message, role } = req.body;

if (!message || typeof message !== "string" || !message.trim()) {
return res.status(400).json({
reply: "Please enter a valid message.",
});
}

if (!["farmer", "customer"].includes(role)) {
return res.status(400).json({
reply: "Invalid user role.",
});
}

if (message.length > 2000) {
return res.status(400).json({
reply: "Please keep your message under 2000 characters.",
});
}

const cleanMessage = message.trim();
const cacheKey = `${role}:${cleanMessage.toLowerCase()}`;

// Return cached response without using Gemini quota
const cached = responseCache.get(cacheKey);

if (cached && Date.now() - cached.time < CACHE_DURATION) {
return res.json({
reply: cached.reply,
cached: true,
fallback: false,
});
}

try {
const prompt = `
You are GraminConnect AI, a helpful assistant for an Indian
farmer-to-customer marketplace.

User role: ${role}

Help farmers with crop management, selling crops online,
product listings and using GraminConnect.

Help customers with agricultural products, product listings
and using GraminConnect.

Rules:

* Reply in simple English or Hinglish based on the user's language.
* Be friendly, clear and concise.
* Never invent product availability, prices or order status.
* For serious crop diseases, recommend consulting a local agricultural expert.
* Do not claim to access the user's account or orders.

User message: ${cleanMessage}
`;

```
const response = await ai.models.generateContent({
  model: "gemini-3.8-flash",
  contents: prompt,
});

const reply =
  response.text ||
  "Sorry, I couldn't generate a response.";

// Save only successful Gemini responses
responseCache.set(cacheKey, {
  reply,
  time: Date.now(),
});

// Keep cache size manageable
if (responseCache.size > 300) {
  const oldestKey = responseCache.keys().next().value;
  responseCache.delete(oldestKey);
}

return res.json({
  reply,
  cached: false,
  fallback: false,
});
```

} catch (error) {
const errorMessage = error.message || "";

if (
  errorMessage.includes("429") ||
  errorMessage.includes("RESOURCE_EXHAUSTED")
) {
  console.log("Gemini quota reached. Using offline response.");
} else if (
  errorMessage.includes("503") ||
  errorMessage.includes("UNAVAILABLE")
) {
  console.log("Gemini is busy. Using offline response.");
} else {
  console.error("Gemini AI Error:", errorMessage);
}

const fallbackReply = getFallbackReply(cleanMessage, role);

return res.json({
  reply: fallbackReply,
  cached: false,
  fallback: true,
});
}
});

module.exports = router;
