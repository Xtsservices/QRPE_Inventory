const db = require('../db');

// Insert new alert
exports.insertAlert = (item_id, alert_name) => {
  return db.execute(
    `INSERT INTO alert (item_id, alert_name, start_date) VALUES (?, ?, UNIX_TIMESTAMP())`,
    [item_id, alert_name]
  );
};

// Update alert end_date
exports.updateAlertEndDate = (alert_id) => {
  return db.execute(
    `UPDATE alert SET end_date = UNIX_TIMESTAMP() WHERE alert_id = ?`,
    [alert_id]
  );
};

// Get all alerts
exports.getAllAlerts = () => {
  return db.execute(`SELECT * FROM alert`);
};
