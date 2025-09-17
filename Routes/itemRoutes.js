const express = require('express');
const router = express.Router();
// const itemController = require('../controllers/itemController'); // Lowercase c
const itemController = require('../controllers/itemcontroller'); // Lowercase c

// CRUD routes
router.post('/items', itemController.createItem);        // POST /api/items
router.get('/items', itemController.getItems);          // GET all
router.get('/items/:item_id', itemController.getItemById); // GET one
router.put('/items/:item_id', itemController.updateItem);  // PUT /api/items/:item_id
router.delete('/items/:item_id', itemController.deleteItem); // DELETE /api/items/:item_id

module.exports = router;