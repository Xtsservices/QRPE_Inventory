const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.post('/orders', orderController.createOrder);           // Create
router.get('/orders', orderController.getOrders);              // Get all
router.get('/orders/:order_id', orderController.getOrderById); // Get by ID
router.put('/orders/:order_id', orderController.updateOrder);  // Update
router.delete('/orders/:order_id', orderController.deleteOrder);// Delete

module.exports = router;
