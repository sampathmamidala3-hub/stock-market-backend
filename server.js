const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

const appointmentRoutes = require("./routes/appointmentRoutes");
const ratingRoutes = require("./routes/ratingRoutes");

dotenv.config();

const app = express();

app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

let isConnected = false;

async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  isConnected = true;
  console.log("MongoDB Atlas connected successfully");
}

app.get("/", async (req, res) => {
  try {
    await connectDB();

    res.status(200).json({
      message: "CHARANAMS CONSTRUCTIONS backend is running",
    });
  } catch (error) {
    res.status(500).json({
      message: "Database connection failed",
      error: error.message,
    });
  }
});

app.get("/api", async (req, res) => {
  try {
    await connectDB();

    res.status(200).json({
      message: "CHARANAMS CONSTRUCTIONS API is running",
    });
  } catch (error) {
    res.status(500).json({
      message: "Database connection failed",
      error: error.message,
    });
  }
});

app.get("/api/health", async (req, res) => {
  try {
    await connectDB();

    res.status(200).json({
      success: true,
      message: "Backend is healthy",
      database: "connected",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Backend database connection failed",
      error: error.message,
    });
  }
});

app.use("/api/appointments", async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    res.status(500).json({
      message: "Database connection failed",
      error: error.message,
    });
  }
}, appointmentRoutes);

app.use("/api/ratings", async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    res.status(500).json({
      message: "Database connection failed",
      error: error.message,
    });
  }
}, ratingRoutes);

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
}

module.exports = app;