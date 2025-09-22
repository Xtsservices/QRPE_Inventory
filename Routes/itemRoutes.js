const express = require("express");
const router = express.Router();
const itemController = require("../controllers/itemcontroller");

// All routes are public (no JWT required)
router.post("/", itemController.createItem);
router.get("/", itemController.getAllItems);
router.get("/:item_id", itemController.getItemById);
router.put("/:item_id", itemController.updateItem);
router.delete("/:item_id", itemController.deleteItem);

module.exports = router;
