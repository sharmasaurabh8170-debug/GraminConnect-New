
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = require("./config/db");
const cropRoutes = require("./routes/cropRoutes");

const app = express();
const userRoutes = require("./routes/userRoutes");
app.use(cors());
app.use(express.json());
app.use("/api/users", userRoutes);
// Connect MongoDB
connectDB();

// Crop API Routes
app.use("/api/crops", cropRoutes);

// Backend Homepage
app.get("/", (req, res) => {
  res.send("GraminConnect Backend is Running!");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});