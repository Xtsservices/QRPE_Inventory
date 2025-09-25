const Joi = require("joi");

const itemSchema = Joi.object({
  id: Joi.number().optional(), // only needed for update
  item_name: Joi.string().trim().required(),
  quantity_unit: Joi.string()
    .pattern(/^\d+(\.\d+)?(kg|g|litre|ml|pcs)$/i) // restrict to valid units
    .required(),
  price: Joi.number().positive().required(),
});

const createOrderSchema = Joi.object({
  vendor_name: Joi.string().trim().required(),
  date: Joi.date().optional(),
  status: Joi.string().valid("Pending", "Completed", "Cancelled").optional(),
  items: Joi.array().items(itemSchema).min(1).required(),
});

const updateOrderSchema = Joi.object({
  vendor_name: Joi.string().trim().required(),
  status: Joi.string().valid("Pending", "Completed", "Cancelled").required(),
  items: Joi.array().items(itemSchema).min(1).required(),
});

// For params validation
const orderIdParamSchema = Joi.object({
  order_id: Joi.number().integer().positive().required(),
});

module.exports = {
  createOrderSchema,
  updateOrderSchema,
  orderIdParamSchema,
};
