const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const validate = require("../middlewares/validate");
const {
  createOrderSchema,
  updateOrderSchema,
  orderIdParamSchema,
} = require("../Validations/orderValidation");

// Create
router.post("/", validate(createOrderSchema), orderController.createOrder);

// Update
router.put("/:order_id", 
  validate(orderIdParamSchema, "params"), 
  validate(updateOrderSchema), 
  orderController.updateOrder
);

// Get all
router.get("/", orderController.getOrders);

// Get by ID
router.get("/:order_id", 
  validate(orderIdParamSchema, "params"), 
  orderController.getOrderById
);

// Delete
router.delete("/:order_id", 
  validate(orderIdParamSchema, "params"), 
  orderController.deleteOrder
);

module.exports = router;
