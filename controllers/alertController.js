const alertQuery = require("../queries/alertquery");
const { createAlertSchema, updateAlertSchema } = require("../Validations/alertValidation");

// Create alert
exports.createAlert = async (req, res) => {
  const { error } = createAlertSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: error.details[0].message });
  }

  const { item_id, alert_name } = req.body;
  try {
    const [result] = await alertQuery.insertAlert(item_id, alert_name);
    res.status(201).json({
      success: true,
      alert_id: result.insertId,
      message: "Alert created for item entry.",
    });
  } catch (err) {
    console.error("Error creating alert:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// Update alert
exports.updateAlert = async (req, res) => {
  const { error } = updateAlertSchema.validate(req.params);
  if (error) {
    return res.status(400).json({ success: false, error: error.details[0].message });
  }

  const { alert_id } = req.params;
  try {
    await alertQuery.updateAlertEndDate(alert_id);
    res.json({ success: true, message: "Alert end date updated to present date." });
  } catch (err) {
    console.error("Error updating alert:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// Get all alerts
exports.getAlerts = async (req, res) => {
  try {
    const [rows] = await alertQuery.getAllAlerts();
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("Error fetching alerts:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};
