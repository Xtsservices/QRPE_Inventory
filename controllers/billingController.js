const db = require('../db'); 
const queries = require('../Queries/billingQuery');

// Create billing
exports.createBilling = async (req, res) => {
  const { order_id, vendor_id, item_id, quantity, notes } = req.body;

  if (!order_id || !vendor_id || !item_id || !quantity) {
    return res.status(400).json({ success: false, message: 'order_id, vendor_id, item_id, and quantity are required' });
  }

  try {
    // Check order exists
    const [order] = await db.execute(queries.checkOrder, [order_id]);
    if (!order.length) return res.status(404).json({ success: false, message: 'Order not found' });

    // Check vendor exists
    const [vendor] = await db.execute(queries.checkVendor, [vendor_id]);
    if (!vendor.length) return res.status(404).json({ success: false, message: 'Vendor not found' });

    // Check item exists
    const [item] = await db.execute(queries.checkItem, [item_id]);
    if (!item.length) return res.status(404).json({ success: false, message: 'Item not found' });

    const cost = parseFloat(item[0].cost); 
    const total = cost * quantity;

    const [result] = await db.execute(queries.insertBilling, [
      order_id, vendor_id, item_id, quantity, cost, total, 'Pending', notes || null
    ]);

    res.status(201).json({ success: true, billing_id: result.insertId, total });
  } catch (err) {
    console.error('Error creating billing:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Get all billing records
exports.getBilling = async (req, res) => {
  try {
    const [rows] = await db.execute(queries.getBilling);

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

 if (!['Paid', 'Pending'].includes(status)) {
  return res.status(400).json({ success: false, message: 'Invalid status' });
}

  try {
    const [result] = await db.execute(queries.updateBillingStatus, [status, billing_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Billing record not found' });
    }

    res.json({ success: true, message: 'Status updated successfully' });
  } catch (err) {
    console.error('Error updating status:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
