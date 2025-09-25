const express = require("express");
const router = express.Router();
const vendorController = require("../controllers/vendorController");
const validate = require("../middlewares/validate");
const { vendorSchema, updateVendorSchema } = require("../Validations/vendorValidation");

// ===== Vendor Routes =====

// Create vendor (with Joi validation)
router.post("/", validate(vendorSchema), vendorController.createVendor);

// Get all vendors
router.get("/", vendorController.getVendors);

// Get vendor by ID
router.get("/:vendor_id", vendorController.getVendorById);

// Update vendor (with Joi validation, status cannot be changed directly)
router.put("/:vendor_id", validate(updateVendorSchema), vendorController.updateVendor);

// Soft delete vendor (mark as inactive)
router.delete("/:vendor_id", vendorController.deleteVendor);

module.exports = router;
