
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = require("./config/db");
const cropRoutes = require("./routes/cropRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const app = express();
const orderRoutes = require("./routes/orderRoutes");
const aiRoutes = require("./routes/aiRoutes");
const userRoutes = require("./routes/userRoutes");
app.use(cors());
app.use(express.json());
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/recommendations", recommendationRoutes);
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