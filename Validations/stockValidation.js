const Joi = require("joi");

const createStockSchema = Joi.object({
  item_id: Joi.number().integer().positive().required(),
  current_stock: Joi.number().min(0).required(),
  unit: Joi.string()
    .valid("kg", "grams", "litre", "ml", "pcs") // ✅ matches your item_master units
    .required(),
  min_threshold: Joi.number().min(0).required(),
});

const updateStockSchema = Joi.object({
  item_id: Joi.number().integer().positive().required(),
  current_stock: Joi.number().min(0).required(),
  unit: Joi.string()
    .valid("kg", "grams", "litre", "ml", "pcs")
    .required(),
  min_threshold: Joi.number().min(0).required(),
});

const stockIdParamSchema = Joi.object({
  stock_id: Joi.number().integer().positive().required(),
});

module.exports = {
  createStockSchema,
  updateStockSchema,
  stockIdParamSchema,
};
