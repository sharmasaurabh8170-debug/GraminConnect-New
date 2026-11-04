const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
{
customerUID: {
type: String,
required: true,
},

customerName: {
  type: String,
  required: true,
},

phone: {
  type: String,
  required: true,
},

address: {
  type: String,
  required: true,
},

items: [
  {
    cropId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Crop",
      required: true,
    },

    cropName: {
      type: String,
      required: true,
    },

    farmerUID: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    status: {
      type: String,
      enum: [
        "Placed",
        "Accepted",
        "Shipped",
        "Delivered",
        "Cancelled",
      ],
      default: "Placed",
    },
  },
],

totalAmount: {
  type: Number,
  required: true,
},

paymentMethod: {
  type: String,
  enum: ["Cash on Delivery"],
  default: "Cash on Delivery",
},

paymentStatus: {
  type: String,
  enum: ["Pending", "Paid", "Failed"],
  default: "Pending",
},

orderStatus: {
  type: String,
  enum: [
    "Placed",
    "Accepted",
    "Shipped",
    "Delivered",
    "Cancelled",
  ],
  default: "Placed",
},

},
{ timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
