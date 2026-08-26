const mongoose = require("mongoose");

const tradeSchema = new mongoose.Schema(
  {
    // ========================================
    // USER
    // ========================================

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ========================================
    // STOCK
    // ========================================

    stock: {
      type: String,
      required: true,
    },

    // ========================================
    // TYPE
    // ========================================

    type: {
      type: String,
      enum: ["BUY", "SELL"],
      required: true,
    },

    // ========================================
    // ENTRY
    // ========================================

    entry: {
      type: Number,
      required: true,
    },

    // ========================================
    // EXIT
    // ========================================

    exit: {
      type: Number,
      required: true,
    },

    // ========================================
    // QUANTITY
    // ========================================

    quantity: {
      type: Number,
      required: true,
    },

    // ========================================
    // DATE
    // ========================================

    date: {
      type: Date,
      required: true,
    },

    // ========================================
    // CHARGES
    // ========================================

    charges: {
      type: Number,
      default: 0,
    },

    // ========================================
    // NOTES
    // ========================================

    notes: {
      type: String,
      default: "",
    },

    // ========================================
    // INVESTMENT
    // ========================================

    investment: {
      type: Number,
      required: true,
    },

    // ========================================
    // PNL
    // ========================================

    pnl: {
      type: Number,
      required: true,
    },

    // ========================================
    // PERCENTAGE
    // ========================================

    percentage: {
      type: Number,
      required: true,
    },
  },

  {
    timestamps: true,
  }
);

const Trade =
  mongoose.model(
    "Trade",
    tradeSchema
  );

module.exports = Trade;