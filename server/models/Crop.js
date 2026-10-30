const mongoose = require("mongoose");

const cropSchema = new mongoose.Schema(
{
farmerUID: {
type: String,
required: true,
},

name: {
  type: String,
  required: true,
},

category: {
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
},

location: {
  type: String,
  required: true,
},

description: {
  type: String,
},

imageUrl: {
  type: String,
},


},
{ timestamps: true }
);

module.exports = mongoose.model("Crop", cropSchema);
