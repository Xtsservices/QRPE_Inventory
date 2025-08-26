const db = require('../db');

// Create alert and throw alert message
exports.createAlert = async (req, res) => {
  const { item_id, alert_name } = req.body;
  if (!item_id || !alert_name) {
    return res.status(400).json({ success: false, error: 'item_id and alert_name are required.' });
  }
  try {
    const [result] = await db.execute(
      `INSERT INTO alert (item_id, alert_name, start_date) VALUES (?, ?, UNIX_TIMESTAMP())`,
      [item_id, alert_name]
    );
    res.status(201).json({ success: true, alert_id: result.insertId, message: 'Alert created for item entry.' });
  } catch (err) {
    console.error('Error creating alert:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Update alert: set end_date to current UNIX date
exports.updateAlert = async (req, res) => {
  const { alert_id } = req.params;
  try {
    await db.execute(
      `UPDATE alert SET end_date = UNIX_TIMESTAMP() WHERE alert_id = ?`,
      [alert_id]
    );
    res.json({ success: true, message: 'Alert end date updated to present date.' });
  } catch (err) {
    console.error('Error updating alert:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// (Optional) Get all alerts
exports.getAlerts = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT * FROM alert`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching alerts:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};