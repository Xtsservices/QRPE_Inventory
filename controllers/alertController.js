const alertQuery = require('../queries/alertquery');

// Create alert
exports.createAlert = async (req, res) => {
  const { item_id, alert_name } = req.body;
  if (!item_id || !alert_name) {
    return res.status(400).json({ success: false, error: 'item_id and alert_name are required.' });
  }
  try {
    const [result] = await alertQuery.insertAlert(item_id, alert_name);
    res.status(201).json({ success: true, alert_id: result.insertId, message: 'Alert created for item entry.' });
  } catch (err) {
    console.error('Error creating alert:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Update alert
exports.updateAlert = async (req, res) => {
  const { alert_id } = req.params;
  try {
    await alertQuery.updateAlertEndDate(alert_id);
    res.json({ success: true, message: 'Alert end date updated to present date.' });
  } catch (err) {
    console.error('Error updating alert:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Get all alerts
exports.getAlerts = async (req, res) => {
  try {
    const [rows] = await alertQuery.getAllAlerts();
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching alerts:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
