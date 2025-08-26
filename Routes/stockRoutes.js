const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');

router.post('/stocks', stockController.createStock);
router.get('/stocks', stockController.getStocks);
router.put('/stocks/:stock_id', stockController.updateStock);
//router.delete('/stocks/:stock_id', stockController.deleteStock);

module.exports = router;