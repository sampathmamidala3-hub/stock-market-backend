const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const Stock = require("./models/stock");
const Trade = require("./models/trade");
const User = require("./models/user");

const app = express();

// =====================================================
// JWT SECRET
// =====================================================

const JWT_SECRET =
  process.env.JWT_SECRET || "trade_tracker_secret_2026";

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

// =====================================================
// MONGODB CONNECTION
// =====================================================

let isConnected = false;

const connectDB = async () => {
  // Already connected
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  // Check environment variable
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing");
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);

    isConnected = true;

    console.log("================================");
    console.log("✅ MongoDB Connected Successfully");
    console.log("================================");

  } catch (error) {
    isConnected = false;

    console.log("================================");
    console.log("❌ MongoDB Connection Failed");
    console.log("================================");
    console.log(error.message);

    throw error;
  }
};

// =====================================================
// AUTHENTICATION MIDDLEWARE
// =====================================================

const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization format",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
    }

    const decoded = jwt.verify(
      token,
      JWT_SECRET
    );

    req.user = decoded;

    next();

  } catch (error) {
    console.log(
      "AUTH ERROR:",
      error.message
    );

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

// =====================================================
// TEST ROUTE
// =====================================================

app.get("/", async (req, res) => {
  try {
    await connectDB();

    res.json({
      success: true,
      message: "Stock Market API is running 🚀",
      database: "connected",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Stock Market API is running, but MongoDB is not connected",
      error: error.message,
    });
  }
});

// =====================================================
// REGISTER
// =====================================================

app.post("/register", async (req, res) => {
  try {
    // Connect database before doing anything
    await connectDB();

    const {
      name,
      email,
      password,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters",
      });
    }

    const cleanEmail =
      email.trim().toLowerCase();

    // Check existing user
    const existingUser =
      await User.findOne({
        email: cleanEmail,
      });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // Hash password
    const hashedPassword =
      await bcrypt.hash(
        password,
        10
      );

    // Create user
    const user =
      await User.create({
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
      });

    res.status(201).json({
      success: true,
      message:
        "Registration successful",

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (error) {
    console.log("REGISTER ERROR:");
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
});

// =====================================================
// LOGIN
// =====================================================

app.post("/login", async (req, res) => {
  try {
    console.log("");
    console.log("================================");
    console.log("LOGIN REQUEST");
    console.log("================================");

    // VERY IMPORTANT
    // Connect MongoDB before searching user
    await connectDB();

    const {
      email,
      password,
    } = req.body;

    console.log(
      "EMAIL:",
      email
    );

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required",
      });
    }

    const cleanEmail =
      email.trim().toLowerCase();

    // Find user
    const user =
      await User.findOne({
        email: cleanEmail,
      });

    if (!user) {
      console.log(
        "USER NOT FOUND"
      );

      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password",
      });
    }

    console.log(
      "USER FOUND:",
      user.email
    );

    // Compare password
    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatch) {
      console.log(
        "PASSWORD DOES NOT MATCH"
      );

      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password",
      });
    }

    console.log(
      "PASSWORD MATCHED"
    );

    // Create JWT
    const token =
      jwt.sign(
        {
          userId:
            user._id.toString(),

          email:
            user.email,
        },

        JWT_SECRET,

        {
          expiresIn: "7d",
        }
      );

    console.log(
      "LOGIN SUCCESSFUL"
    );

    res.json({
      success: true,

      message:
        "Login successful",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (error) {
    console.log("");
    console.log("================================");
    console.log("LOGIN ERROR");
    console.log("================================");
    console.log(error);
    console.log("MESSAGE:", error.message);

    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
});

// =====================================================
// CURRENT USER
// =====================================================

app.get(
  "/me",
  authenticateToken,
  async (req, res) => {
    try {
      await connectDB();

      const user =
        await User.findById(
          req.user.userId
        ).select("-password");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        user,
      });

    } catch (error) {
      console.log(
        "ME ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to get user",
        error:
          error.message,
      });
    }
  }
);

// =====================================================
// ADD STOCK
// =====================================================

app.post(
  "/add-stock",
  authenticateToken,
  async (req, res) => {
    try {
      await connectDB();

      const {
        symbol,
        companyName,
        price,
        quantity,
        sector,
      } = req.body;

      if (!symbol) {
        return res.status(400).json({
          success: false,
          message:
            "Stock symbol is required",
        });
      }

      const stock =
        await Stock.create({
          userId:
            req.user.userId,

          symbol:
            String(symbol).toUpperCase(),

          companyName,

          price:
            Number(price),

          quantity:
            Number(quantity),

          sector,
        });

      res.status(201).json({
        success: true,

        message:
          "Stock added successfully",

        stock,
      });

    } catch (error) {
      console.log(
        "ADD STOCK ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to add stock",
        error:
          error.message,
      });
    }
  }
);

// =====================================================
// GET USER STOCKS
// =====================================================

app.get(
  "/stocks",
  authenticateToken,
  async (req, res) => {
    try {
      await connectDB();

      const stocks =
        await Stock.find({
          userId:
            req.user.userId,
        }).sort({
          createdAt: -1,
        });

      res.json(stocks);

    } catch (error) {
      console.log(
        "GET STOCK ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch stocks",
        error:
          error.message,
      });
    }
  }
);

// =====================================================
// ADD TRADE
// =====================================================

app.post(
  "/add-trade",
  authenticateToken,
  async (req, res) => {
    try {
      await connectDB();

      console.log("");
      console.log("================================");
      console.log("NEW TRADE");
      console.log("USER:", req.user.userId);
      console.log("================================");

      console.log(req.body);

      const {
        stock,
        type,
        entry,
        exit,
        quantity,
        date,
        charges,
        investment,
        pnl,
        percentage,
        notes,
      } = req.body;

      // Validation
      if (!stock) {
        return res.status(400).json({
          success: false,
          message:
            "Stock is required",
        });
      }

      if (!type) {
        return res.status(400).json({
          success: false,
          message:
            "Trade type is required",
        });
      }

      if (
        entry === undefined ||
        entry === ""
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Entry price is required",
        });
      }

      if (
        exit === undefined ||
        exit === ""
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Exit price is required",
        });
      }

      if (
        quantity === undefined ||
        quantity === ""
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Quantity is required",
        });
      }

      if (!date) {
        return res.status(400).json({
          success: false,
          message:
            "Date is required",
        });
      }

      // Numbers
      const entryNumber =
        Number(entry);

      const exitNumber =
        Number(exit);

      const quantityNumber =
        Number(quantity);

      const chargesNumber =
        charges === "" ||
        charges === undefined
          ? 0
          : Number(charges);

      // =================================================
      // CORRECT BUY / SELL P&L
      // =================================================

      let calculatedPnl = 0;

      if (
        String(type).toUpperCase() ===
        "SELL"
      ) {
        calculatedPnl =
          (entryNumber - exitNumber) *
          quantityNumber;
      } else {
        calculatedPnl =
          (exitNumber - entryNumber) *
          quantityNumber;
      }

      // Subtract charges
      calculatedPnl =
        calculatedPnl -
        chargesNumber;

      // =================================================
      // PERCENTAGE
      // =================================================

      const investmentNumber =
        entryNumber *
        quantityNumber;

      const calculatedPercentage =
        investmentNumber !== 0
          ? (
              calculatedPnl /
              investmentNumber
            ) * 100
          : 0;

      // =================================================
      // CREATE TRADE
      // =================================================

      const trade =
        new Trade({
          userId:
            req.user.userId,

          stock:
            String(stock)
              .trim()
              .toUpperCase(),

          type:
            String(type)
              .trim()
              .toUpperCase(),

          entry:
            entryNumber,

          exit:
            exitNumber,

          quantity:
            quantityNumber,

          date:
            new Date(date),

          charges:
            chargesNumber,

          notes:
            notes || "",

          investment:
            investment === "" ||
            investment === undefined
              ? investmentNumber
              : Number(investment),

          pnl:
            pnl === "" ||
            pnl === undefined
              ? calculatedPnl
              : Number(pnl),

          percentage:
            percentage === "" ||
            percentage === undefined
              ? calculatedPercentage
              : Number(percentage),
        });

      const savedTrade =
        await trade.save();

      console.log(
        "TRADE SAVED:",
        savedTrade._id
      );

      res.status(201).json({
        success: true,

        message:
          "Trade added successfully",

        trade:
          savedTrade,
      });

    } catch (error) {
      console.log("");
      console.log("================================");
      console.log("ADD TRADE ERROR");
      console.log("================================");
      console.log(error);

      res.status(500).json({
        success: false,

        message:
          "Failed to add trade",

        error:
          error.message,
      });
    }
  }
);

// =====================================================
// GET USER TRADES
// =====================================================

app.get(
  "/trades",
  authenticateToken,
  async (req, res) => {
    try {
      await connectDB();

      const trades =
        await Trade.find({
          userId:
            req.user.userId,
        }).sort({
          createdAt: -1,
        });

      res.status(200).json(
        trades
      );

    } catch (error) {
      console.log(
        "GET TRADES ERROR:",
        error
      );

      res.status(500).json({
        success: false,

        message:
          "Failed to fetch trades",

        error:
          error.message,
      });
    }
  }
);

// =====================================================
// GET SINGLE TRADE
// =====================================================

app.get(
  "/trade/:id",
  authenticateToken,
  async (req, res) => {
    try {
      await connectDB();

      const {
        id,
      } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid trade ID",
        });
      }

      const trade =
        await Trade.findOne({
          _id: id,

          userId:
            req.user.userId,
        });

      if (!trade) {
        return res.status(404).json({
          success: false,
          message:
            "Trade not found",
        });
      }

      res.json({
        success: true,
        trade,
      });

    } catch (error) {
      console.log(
        "GET SINGLE TRADE ERROR:",
        error
      );

      res.status(500).json({
        success: false,

        message:
          "Failed to fetch trade",

        error:
          error.message,
      });
    }
  }
);

// =====================================================
// DELETE SINGLE TRADE
// =====================================================

app.delete(
  "/delete-trade/:id",
  authenticateToken,
  async (req, res) => {
    try {
      await connectDB();

      const {
        id,
      } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Invalid trade ID",
        });
      }

      const deletedTrade =
        await Trade.findOneAndDelete({
          _id: id,

          userId:
            req.user.userId,
        });

      if (!deletedTrade) {
        return res.status(404).json({
          success: false,

          message:
            "Trade not found",
        });
      }

      console.log(
        "TRADE DELETED:",
        deletedTrade._id
      );

      res.status(200).json({
        success: true,

        message:
          "Trade deleted successfully",

        trade:
          deletedTrade,
      });

    } catch (error) {
      console.log(
        "DELETE ERROR:",
        error
      );

      res.status(500).json({
        success: false,

        message:
          "Failed to delete trade",

        error:
          error.message,
      });
    }
  }
);

// =====================================================
// DELETE ALL USER TRADES
// =====================================================

app.delete(
  "/delete-all-trades",
  authenticateToken,
  async (req, res) => {
    try {
      await connectDB();

      const result =
        await Trade.deleteMany({
          userId:
            req.user.userId,
        });

      res.status(200).json({
        success: true,

        message:
          "All your trades deleted successfully",

        deletedCount:
          result.deletedCount,
      });

    } catch (error) {
      console.log(
        "DELETE ALL ERROR:",
        error
      );

      res.status(500).json({
        success: false,

        message:
          "Failed to delete all trades",

        error:
          error.message,
      });
    }
  }
);

// =====================================================
// UPDATE USER TRADE
// =====================================================

app.put(
  "/update-trade/:id",
  authenticateToken,
  async (req, res) => {
    try {
      await connectDB();

      const {
        id,
      } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Invalid trade ID",
        });
      }

      const updatedTrade =
        await Trade.findOneAndUpdate(
          {
            _id: id,

            userId:
              req.user.userId,
          },

          req.body,

          {
            new: true,

            runValidators: true,
          }
        );

      if (!updatedTrade) {
        return res.status(404).json({
          success: false,

          message:
            "Trade not found",
        });
      }

      res.json({
        success: true,

        message:
          "Trade updated successfully",

        trade:
          updatedTrade,
      });

    } catch (error) {
      console.log(
        "UPDATE ERROR:",
        error
      );

      res.status(500).json({
        success: false,

        message:
          "Failed to update trade",

        error:
          error.message,
      });
    }
  }
);

// =====================================================
// 404 ROUTE
// =====================================================

app.use(
  (req, res) => {
    res.status(404).json({
      success: false,

      message:
        `Route not found: ${req.method} ${req.originalUrl}`,
    });
  }
);

// =====================================================
// VERCEL EXPORT
// =====================================================

module.exports = app;