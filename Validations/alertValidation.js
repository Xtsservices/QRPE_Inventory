const Joi = require("joi");

// Schema for creating an alert
const createAlertSchema = Joi.object({
  item_id: Joi.number().integer().positive().required(),
  alert_name: Joi.string().min(3).max(100).required(),
});

// Schema for updating an alert
const updateAlertSchema = Joi.object({
  alert_id: Joi.number().integer().positive().required(),
});

module.exports = {
  createAlertSchema,
  updateAlertSchema,
};
