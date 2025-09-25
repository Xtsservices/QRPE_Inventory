// validators/itemValidator.js
const Joi = require("joi");

// Common rules
const statusValues = [1, 2]; // Active = 1, Inactive = 2

// CREATE schema
const createItemSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required(),
  type: Joi.string().trim().min(2).max(50).required(),
  units: Joi.string().trim().min(1).max(20).required(),
  quantity: Joi.number().integer().positive().required(),
  cost: Joi.number().min(0).required(),
  status_id: Joi.number().valid(...statusValues).default(1),
});

// UPDATE schema → all fields optional but must be valid if provided
const updateItemSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50),
  type: Joi.string().trim().min(2).max(50),
  units: Joi.string().trim().min(1).max(20),
  quantity: Joi.number().integer().positive(),
  cost: Joi.number().min(0),
  status_id: Joi.number().valid(...statusValues),
}).min(1); // at least one field required

// PARAM schema for :item_id
const itemIdParamSchema = Joi.object({
  item_id: Joi.number().integer().positive().required(),
});

module.exports = {
  createItemSchema,
  updateItemSchema,
  itemIdParamSchema,
};
