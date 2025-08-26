const db = require('../db');

// Create billing
exports.createBilling = async (req, res) => {
  let { item_id, vendor_id, quantity, cost } = req.body;
  quantity = quantity ?? null;
  cost = cost ?? null;

  // Automatically increase cost by 10% if quantity > 300
  if (quantity > 300 && cost !== null) {
    cost = cost * 5;
  }
  const total = quantity && cost ? quantity * cost : null;

  try {
    const [result] = await db.execute(
      `INSERT INTO billing (item_id, vendor_id, quantity, cost, total)
       VALUES (?, ?, ?, ?, ?)`,
      [item_id, vendor_id, quantity, cost, total]
    );
    res.status(201).json({ success: true, billing_id: result.insertId });
  } catch (err) {
    console.error('Error creating billing:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Read all billings
exports.getBillings = async (req, res) => {
  try {
    const [rows] = await db.execute(`SELECT * FROM billing`);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching billings:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};