const Joi = require("joi");

const itemSchema = Joi.object({
  item_name: Joi.string().min(2).max(100).required(),
  quantity: Joi.number().integer().min(1).required(),
  price: Joi.number().precision(2).min(0).required()
});

const createRequestSchema = Joi.object({
  requested_by: Joi.string().min(2).max(100).required(),
  items: Joi.array().items(itemSchema).min(1).required()
});

const updateRequestSchema = Joi.object({
  requested_by: Joi.string().min(2).max(100).required(),
  items: Joi.array().items(itemSchema).min(1)
});

module.exports = {
  createRequestSchema,
  updateRequestSchema
};
