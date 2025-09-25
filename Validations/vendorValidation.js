const Joi = require("joi");

// Common schema for vendor
const vendorSchema = Joi.object({
  vendor_name: Joi.string().max(150).required(),
  license_number: Joi.string().max(50).required(),
  gst_number: Joi.string().max(50).required(),
  pan_number: Joi.string().max(20).required(),
  contact_person: Joi.string().max(100).required(),
  contact_mobile: Joi.string().pattern(/^[0-9]{10}$/).required(),
  contact_email: Joi.string().email().required(),
  mobile_number: Joi.string().pattern(/^[0-9]{10}$/).required(),
  full_address: Joi.string().max(255).required(),
});

// Partial schema for updates (all fields optional)
const updateVendorSchema = Joi.object({
  vendor_name: Joi.string().max(150),
  license_number: Joi.string().max(50),
  gst_number: Joi.string().max(50),
  pan_number: Joi.string().max(20),
  contact_person: Joi.string().max(100),
  contact_mobile: Joi.string().pattern(/^[0-9]{10}$/),
  contact_email: Joi.string().email(),
  mobile_number: Joi.string().pattern(/^[0-9]{10}$/),
  full_address: Joi.string().max(255),
}).min(1); // at least 1 field required

module.exports = { vendorSchema, updateVendorSchema };
