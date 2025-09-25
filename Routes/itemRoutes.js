const express = require("express");
const router = express.Router();
const itemController = require("../controllers/itemcontroller");

// Validation middleware + schemas
const validate = require("../middlewares/validate");
const {
  createItemSchema,
  updateItemSchema,
  itemIdParamSchema,
} = require("../Validations/itemValidation");

// Create item → body validation
router.post("/", validate(createItemSchema), itemController.createItem);

// Get all items
router.get("/", itemController.getAllItems);

// Get item by ID → param validation
router.get("/:item_id", validate(itemIdParamSchema, "params"), itemController.getItemById);

// Update item → param + body validation
router.put(
  "/:item_id",
  validate(itemIdParamSchema, "params"),
  validate(updateItemSchema),
  itemController.updateItem
);

// Soft delete item → param validation
router.delete("/:item_id", validate(itemIdParamSchema, "params"), itemController.deleteItem);

module.exports = router;
