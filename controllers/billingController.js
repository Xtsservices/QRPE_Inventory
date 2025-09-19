const db = require('../db');

// Create billing
exports.createBilling = async (req, res) => {
  const { order_id, vendor_id, item_id, quantity, notes } = req.body;

  if (!order_id || !vendor_id || !item_id || !quantity) {
    return res.status(400).json({ success: false, message: 'order_id, vendor_id, item_id, and quantity are required' });
  }

  try {
    // Check order exists
    const [order] = await db.execute(`SELECT * FROM orders WHERE order_id = ?`, [order_id]);
    if (!order.length) return res.status(404).json({ success: false, message: 'Order not found' });

    // Check vendor exists
    const [vendor] = await db.execute(`SELECT * FROM vendors WHERE vendor_id = ?`, [vendor_id]);
    if (!vendor.length) return res.status(404).json({ success: false, message: 'Vendor not found' });

    // Check item exists
    const [item] = await db.execute(`SELECT cost FROM items WHERE item_id = ?`, [item_id]);
    if (!item.length) return res.status(404).json({ success: false, message: 'Item not found' });

    const cost = parseFloat(item[0].cost); 
    const total = cost * quantity;

    const [result] = await db.execute(
      `INSERT INTO billing (order_id, vendor_id, item_id, quantity, cost, total, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?,?)`,
      [order_id, vendor_id, item_id, quantity, cost, total, notes || null]
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
const [rows] = await db.execute(`
  SELECT 
      b.billing_id,
      b.order_id,
      b.vendor_id,
      v.vendor_name,
      b.item_id,
      i.item_name,
      b.quantity,
      b.cost,
      b.total,
      b.status,
      o.status AS order_status,
      b.notes,
      o.date AS order_date 
  FROM billing b
  LEFT JOIN vendors v ON b.vendor_id = v.vendor_id
  LEFT JOIN items i ON b.item_id = i.item_id
  LEFT JOIN orders o ON b.order_id = o.order_id 
  ORDER BY b.billing_id DESC
`);

    res.json({
      success: true,
      data: rows
    });
  } catch (err) {
    console.error("Error fetching billing:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// Update billing status
exports.updateBillingStatus = async (req, res) => {
  const { billing_id } = req.params;
  const { status } = req.body;

if (!['Paid', 'Pending', 'Cancelled'].includes(status)) {
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
