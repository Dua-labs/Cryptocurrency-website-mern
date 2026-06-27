const express = require("express");
const router = express.Router();
const portfolioController = require("../controllers/portfolioController");

// ✅ Correct import
const { protect } = require("../middleware/auth");

// Get full portfolio
router.get("/", protect, portfolioController.getPortfolio);

// Add / Update holding
router.post("/holding", protect, portfolioController.addOrUpdateHolding);

// Delete holding
router.delete("/holding/:coinId", protect, portfolioController.deleteHolding);

// Portfolio summary
router.get("/summary", protect, portfolioController.getSummary);

module.exports = router;