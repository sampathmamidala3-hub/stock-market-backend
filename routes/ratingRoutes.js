const express = require("express");
const router = express.Router();

const Rating = require("../models/rating");

router.post("/", async (req, res) => {
  try {
    const { name, rating, review } = req.body;

    if (!name || !rating) {
      return res.status(400).json({
        message: "Name and rating are required",
      });
    }

    const newRating = new Rating({
      name,
      rating,
      review,
    });

    const savedRating = await newRating.save();

    res.status(201).json({
      message: "Rating submitted successfully",
      rating: savedRating,
    });
  } catch (error) {
    console.error("Rating error:", error);

    res.status(500).json({
      message: "Failed to submit rating",
      error: error.message,
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const ratings = await Rating.find().sort({
      createdAt: -1,
    });

    res.json(ratings);
  } catch (error) {
    console.error("Get ratings error:", error);

    res.status(500).json({
      message: "Failed to get ratings",
      error: error.message,
    });
  }
});

module.exports = router;