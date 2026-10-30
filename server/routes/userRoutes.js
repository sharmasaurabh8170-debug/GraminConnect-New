const express = require("express");
const router = express.Router();

const User = require("../models/User");
const adminAuth = require("../config/firebaseAdmin");

// Save user profile
router.post("/profile", async (req, res) => {
try {
const authHeader = req.headers.authorization;


if (!authHeader || !authHeader.startsWith("Bearer ")) {
  return res.status(401).json({
    message: "Authentication required",
  });
}

const token = authHeader.split(" ")[1];

// Verify Firebase token
const decodedToken = await adminAuth.verifyIdToken(token);

const { name, role } = req.body;

if (!name || !["farmer", "customer"].includes(role)) {
  return res.status(400).json({
    message: "Valid name and role are required",
  });
}

const email = decodedToken.email;

if (!email) {
  return res.status(400).json({
    message: "Email not found in Firebase account",
  });
}

const user = await User.findOneAndUpdate(
  { firebaseUID: decodedToken.uid },
  {
    firebaseUID: decodedToken.uid,
    name,
    email,
    role,
  },
  {
    new: true,
    upsert: true,
    runValidators: true,
  }
);

res.status(200).json({
  message: "User profile saved successfully!",
  user,
});


} catch (error) {
console.error("User Profile Error:", error);


res.status(500).json({
  message: "Unable to save user profile",
});


}
});

// Get logged-in user's profile
router.get("/profile", async (req, res) => {
try {
const authHeader = req.headers.authorization;


if (!authHeader || !authHeader.startsWith("Bearer ")) {
  return res.status(401).json({
    message: "Authentication required",
  });
}

const token = authHeader.split(" ")[1];

const decodedToken = await adminAuth.verifyIdToken(token);

const user = await User.findOne({
  firebaseUID: decodedToken.uid,
});

if (!user) {
  return res.status(404).json({
    message: "User profile not found",
  });
}

res.status(200).json({ user });


} catch (error) {
  console.error("Get Profile Error:", error);

  res.status(500).json({
    message: "Unable to fetch user profile",
  });
}
});

module.exports = router;
