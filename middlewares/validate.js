// middlewares/validate.js
module.exports = (schema, property = "body") => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details.map((d) => d.message),
      });
    }
    req[property] = value; // cleaned data
    next();
  };
};
