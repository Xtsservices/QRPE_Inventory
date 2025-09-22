const express = require("express");
const router = express.Router();
const vendorController = require("../controllers/vendorController");

router.post("/", vendorController.createVendor); // POST /api/vendors
router.get("/", vendorController.getVendors); // GET /api/vendors
router.put("/:vendor_id", vendorController.updateVendor); // PUT /api/vendors/:vendor_id
router.delete("/:vendor_id", vendorController.deleteVendor); // DELETE /api/vendors/:vendor_id

module.exports = router;
