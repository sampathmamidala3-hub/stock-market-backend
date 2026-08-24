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
    credentials: false,
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    message: "CHARANAMS CONSTRUCTIONS backend is running",
  });
});

app.get("/api", (req, res) => {
  res.status(200).json({
    message: "CHARANAMS CONSTRUCTIONS API is running",
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend is healthy",
  });
});

app.use("/api/appointments", appointmentRoutes);
app.use("/api/ratings", ratingRoutes);

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB Atlas connected successfully");

    if (process.env.NODE_ENV !== "production") {
      app.listen(PORT, () => {
        console.log(
          `Backend running on http://localhost:${PORT}`
        );
      });
    }
  })
  .catch((error) => {
    console.error("MongoDB connection failed:");
    console.error(error.message);
  });

module.exports = app;