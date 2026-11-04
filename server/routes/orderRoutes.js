const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const Order = require("../models/Order");
const Crop = require("../models/Crop");
const User = require("../models/User");
const adminAuth = require("../config/firebaseAdmin");

// VERIFY FIREBASE TOKEN
const verifyToken = async (req, res, next) => {
try {
const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith("Bearer ")) {
  return res.status(401).json({
    message: "Please log in first.",
  });
}

const token = authHeader.split(" ")[1];
req.user = await adminAuth.verifyIdToken(token);

next();

} catch (error) {
return res.status(401).json({
message: "Invalid or expired authentication token.",
});
}
};

// VERIFY CUSTOMER
const verifyCustomer = async (req, res, next) => {
try {
const user = await User.findOne({
firebaseUID: req.user.uid,
});

if (!user || user.role !== "customer") {
  return res.status(403).json({
    message: "Only customers can place orders.",
  });
}

req.userProfile = user;
next();

} catch (error) {
res.status(500).json({
message: "Could not verify customer account.",
});
}
};

// VERIFY FARMER
const verifyFarmer = async (req, res, next) => {
try {
const user = await User.findOne({
firebaseUID: req.user.uid,
});

if (!user || user.role !== "farmer") {
  return res.status(403).json({
    message: "Only farmers can access this action.",
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

// PLACE ORDER
router.post("/place", verifyToken, verifyCustomer, async (req, res) => {
try {
const { phone, address, items } = req.body;

if (!phone || !address || !Array.isArray(items) || items.length === 0) {
  return res.status(400).json({
    message: "Phone, address and at least one product are required.",
  });
}

if (items.length > 50) {
  return res.status(400).json({
    message: "Too many products in one order.",
  });
}

// Validate product IDs and combine duplicate crop entries.
const quantities = new Map();

for (const item of items) {
  if (
    !item.cropId ||
    !mongoose.Types.ObjectId.isValid(item.cropId) ||
    !Number.isSafeInteger(item.quantity) ||
    item.quantity < 1
  ) {
    return res.status(400).json({
      message: "Invalid product or quantity.",
    });
  }

  const id = item.cropId.toString();
  quantities.set(id, (quantities.get(id) || 0) + item.quantity);
}

const cropIds = [...quantities.keys()];

// Load the actual products from MongoDB.
const crops = await Crop.find({
  _id: { $in: cropIds },
});

if (crops.length !== cropIds.length) {
  return res.status(404).json({
    message: "One or more products were not found.",
  });
}

const orderItems = [];
let totalAmount = 0;

for (const crop of crops) {
  const quantity = quantities.get(crop._id.toString());

  if (crop.farmerUID === req.user.uid) {
    return res.status(400).json({
      message: "You cannot order your own products.",
    });
  }

  if (!Number.isFinite(crop.price) || crop.price < 0) {
    return res.status(400).json({
      message: `Invalid price for ${crop.name}.`,
    });
  }

  if (!Number.isFinite(crop.quantity) || crop.quantity < quantity) {
    return res.status(400).json({
      message: `${crop.name} does not have enough stock.`,
    });
  }

  orderItems.push({
    cropId: crop._id,
    cropName: crop.name,
    farmerUID: crop.farmerUID,
    price: crop.price,
    quantity,
  });

  totalAmount += crop.price * quantity;
}

const customer = req.userProfile;

const newOrder = new Order({
  customerUID: req.user.uid,
  customerName: customer.name,
  phone,
  address,
  items: orderItems,
  totalAmount,
  paymentMethod: "Cash on Delivery",
  paymentStatus: "Pending",
  orderStatus: "Placed",
});

const savedOrder = await newOrder.save();

res.status(201).json({
  success: true,
  message: "Order placed successfully!",
  order: savedOrder,
});

} catch (error) {
console.error("Place order error:", error);

res.status(500).json({
  message: "Could not place order.",
});

}
});

// CUSTOMER: GET MY ORDERS
router.get("/my-orders", verifyToken, verifyCustomer, async (req, res) => {
try {
const orders = await Order.find({
customerUID: req.user.uid,
}).sort({ createdAt: -1 });

res.status(200).json(orders);
} catch (error) {
res.status(500).json({
message: "Could not fetch your orders.",
});
}
});

// FARMER: GET ORDERS CONTAINING THEIR PRODUCTS
router.get("/farmer-orders", verifyToken, verifyFarmer, async (req, res) => {
try {
const orders = await Order.find({
"items.farmerUID": req.user.uid,
}).sort({ createdAt: -1 });

res.status(200).json(orders);
} catch (error) {
res.status(500).json({
message: "Could not fetch farmer orders.",
});
}
});

// FARMER: UPDATE ORDER STATUS
router.put("/update/:id", verifyToken, verifyFarmer, async (req, res) => {
try {
const { orderStatus } = req.body;

const allowedStatuses = [
  "Placed",
  "Accepted",
  "Shipped",
  "Delivered",
  "Cancelled",
];

if (!allowedStatuses.includes(orderStatus)) {
  return res.status(400).json({
    message: "Invalid order status.",
  });
}

const order = await Order.findOne({
  _id: req.params.id,
  "items.farmerUID": req.user.uid,
});

if (!order) {
  return res.status(404).json({
    message: "Order not found.",
  });
}

// A farmer can update only their own items in a multi-farmer order.
// Keep the overall order status unchanged because other farmers
// may still need to process their own items.
let updated = false;

for (const item of order.items) {
  if (item.farmerUID === req.user.uid) {
    item.set("status", orderStatus);
    updated = true;
  }
}

if (!updated) {
  return res.status(403).json({
    message: "You cannot update this order.",
  });
}

await order.save();

res.status(200).json({
  success: true,
  message: "Your product order status was updated.",
  order,
});
} catch (error) {
console.error("Update order error:", error);

res.status(500).json({
  message: "Could not update order status.",
});

}
});

module.exports = router;
