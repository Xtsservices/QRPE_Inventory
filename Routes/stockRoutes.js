const express = require("express");
const router = express.Router();
const stockController = require("../controllers/stockController");
const validate = require("../middlewares/validate");
const {
  createStockSchema,
  updateStockSchema,
  stockIdParamSchema,
} = require("../Validations/stockValidation");

// Create stock
router.post("/", validate(createStockSchema), stockController.createStock);

// Get all stocks
router.get("/", stockController.getStocks);

// Update stock
router.put(
  "/:stock_id",
  validate(stockIdParamSchema, "params"),
  validate(updateStockSchema),
  stockController.updateStock
);

module.exports = router;
