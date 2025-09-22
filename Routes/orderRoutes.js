const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

router.post("/", orderController.createOrder); // ✅ create route
router.post("/orders", orderController.createOrder);
router.get("/", orderController.getOrders);
router.get("/order_id", orderController.getOrderById);
router.put("/:order_id", orderController.updateOrder);
//router.delete("/:id", orderController.deleteOrder);

module.exports = router;
