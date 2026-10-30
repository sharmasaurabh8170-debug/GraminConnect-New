const express = require("express");
const router = express.Router();

const Crop = require("../models/Crop");
const User = require("../models/User");
const adminAuth = require("../config/firebaseAdmin");

// VERIFY FIREBASE TOKEN
const verifyToken = async (req, res, next) => {
try {
const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith("Bearer ")) {
  return res.status(401).json({
    message: "Authentication required. Please log in.",
  });
}

const token = authHeader.split(" ")[1];

const decodedToken = await adminAuth.verifyIdToken(token);

req.user = decodedToken;

next();
} catch (error) {
return res.status(401).json({
message: "Invalid or expired authentication token.",
});
}
};

// CHECK FARMER ROLE
const verifyFarmer = async (req, res, next) => {
try {
const user = await User.findOne({
firebaseUID: req.user.uid,
});

if (!user || user.role !== "farmer") {
  return res.status(403).json({
    message: "Only registered farmers can perform this action.",
  });
}

req.userProfile = user;
next();
} catch (error) {
res.status(500).json({
message: "Could not verify farmer account.",
});
}
};

// ADD NEW CROP
router.post("/add", verifyToken, verifyFarmer, async (req, res) => {
try {
const {
name,
category,
price,
quantity,
location,
description,
imageUrl,
} = req.body;

const newCrop = new Crop({
  farmerUID: req.user.uid,
  name,
  category,
  price,
  quantity,
  location,
  description,
  imageUrl,
});

const savedCrop = await newCrop.save();

res.status(201).json({
  message: "Crop added successfully!",
  crop: savedCrop,
});
} catch (error) {
res.status(400).json({
message: error.message,
});
}
});

// GET ALL CROPS
router.get("/", async (req, res) => {
try {
const crops = await Crop.find().sort({ createdAt: -1 });

res.status(200).json(crops);
} catch (error) {
res.status(500).json({
message: error.message,
});
}
});

// GET SINGLE CROP
router.get("/:id", async (req, res) => {
try {
const crop = await Crop.findById(req.params.id);

if (!crop) {
  return res.status(404).json({
    message: "Crop not found",
  });
}

res.status(200).json(crop);
} catch (error) {
res.status(400).json({
message: error.message,
});
}
});

// DELETE CROP - ONLY ITS OWNER
router.delete("/:id", verifyToken, verifyFarmer, async (req, res) => {
try {
const crop = await Crop.findOneAndDelete({
_id: req.params.id,
farmerUID: req.user.uid,
});

if (!crop) {
  return res.status(404).json({
    message: "Crop not found or you are not authorized to delete it.",
  });
}

res.status(200).json({
  message: "Crop deleted successfully!",
});

} catch (error) {
res.status(400).json({
message: error.message,
});
}
});

module.exports = router;
