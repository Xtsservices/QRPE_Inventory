const express = require("express");
const router = express.Router();

const alertController = require("../controllers/alertController");
const { createAlertSchema, updateAlertSchema } = require("../Validations/alertValidation");
const validate = require("../middlewares/validate");

// Create alert
router.post("/", validate(createAlertSchema), alertController.createAlert);

// Update alert (params -> alert_id)
router.put("/:alert_id", validate(updateAlertSchema, "params"), alertController.updateAlert);

// Get all alerts
router.get("/", alertController.getAlerts);

module.exports = router;
