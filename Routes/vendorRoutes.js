const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');

router.post('/vendors', vendorController.createVendor);
router.get('/vendors', vendorController.getVendors);
router.put('/vendors/:vendor_id', vendorController.updateVendor);
//router.delete('/vendors/:vendor_id', vendorController.deleteVendor);

module.exports = router;