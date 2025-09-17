const db = require('../db');

// Create billing
exports.createBilling = async (req, res) => {
  const { vendor_id, item_id, quantity, notes } = req.body;

  if (!vendor_id || !item_id || !quantity) {
    return res.status(400).json({ success: false, message: 'vendor_id, item_id, and quantity are required' });
  }

  try {
    // Check vendor exists
    const [vendor] = await db.execute(`SELECT * FROM vendors WHERE vendor_id = ?`, [vendor_id]);
    if (!vendor.length) return res.status(404).json({ success: false, message: 'Vendor not found' });

    // Check item exists
    const [item] = await db.execute(`SELECT cost FROM item_master WHERE item_id = ?`, [item_id]);
    if (!item.length) return res.status(404).json({ success: false, message: 'Item not found' });

    const cost = parseFloat(item[0].cost); // ensure number
    const total = cost * quantity;

    const [result] = await db.execute(
      `INSERT INTO billing (vendor_id, item_id, quantity, cost, total, status, notes)
       VALUES (?, ?, ?, ?, ?, 'Pending', ?)`,
      [vendor_id, item_id, quantity, cost, total, notes || null]
    );

    res.status(201).json({ success: true, billing_id: result.insertId, total });
  } catch (err) {
    console.error('Error creating billing:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Get all billing records
exports.getBilling = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT b.billing_id, b.quantity, b.cost, b.total, b.status, b.notes, b.date,
              v.vendor_name, i.item_name
       FROM billing b
       JOIN vendors v ON b.vendor_id = v.vendor_id
       JOIN item_master i ON b.item_id = i.item_id
       ORDER BY b.date DESC`
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching billing:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Update billing status
exports.updateBillingStatus = async (req, res) => {
  const { billing_id } = req.params;
  const { status } = req.body;

  if (!['Paid', 'Pending'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  try {
    const [result] = await db.execute(
      `UPDATE billing SET status = ? WHERE billing_id = ?`,
      [status, billing_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Billing record not found' });
    }

    res.json({ success: true, message: 'Status updated successfully' });
  } catch (err) {
    console.error('Error updating status:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
