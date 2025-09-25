const db = require("../db");
const queries = require("../Queries/billingQuery");

// Create billing
exports.createBilling = async (req, res) => {
  const { order_id, vendor_id, item_name, notes } = req.body;

  if (!order_id || !vendor_id || !item_name) {
    return res.status(400).json({
      success: false,
      message: "order_id, vendor_id, and item_name are required",
    });
  }

  try {
    // Check order exists
    const [order] = await db.execute(queries.checkOrder, [order_id]);
    if (!order.length)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    // Check vendor exists
    const [vendor] = await db.execute(queries.checkVendor, [vendor_id]);
    if (!vendor.length)
      return res
        .status(404)
        .json({ success: false, message: "Vendor not found" });

    // Get the order_item record for this order and item_name
    const [orderItem] = await db.execute(
      `SELECT quantity, price AS cost, total 
   FROM order_items 
   WHERE order_id = ? AND item_name = ?`,
      [order_id, item_name] // or item_id if you have it
    );
    if (!orderItem.length)
      return res
        .status(404)
        .json({ success: false, message: "Item not found in order" });

    const { quantity, cost } = orderItem[0];
    const total = cost;

    // Insert billing record
    const [result] = await db.execute(queries.insertBilling, [
      order_id,
      vendor_id,
      item_name,
      quantity,
      cost,
      total, // using Option A
      "Pending",
      notes || null,
    ]);

    res.status(201).json({ success: true, billing_id: result.insertId, total });
  } catch (err) {
    console.error("Error creating billing:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// Get all billing records
exports.getBilling = async (req, res) => {
  try {
    const [rows] = await db.execute(queries.getBilling);

    res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error("Error fetching billing:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// Update billing status
exports.updateBillingStatus = async (req, res) => {
  const { billing_id } = req.params;
  const { cost, notes } = req.body;

  if (!billing_id || cost === undefined) {
    return res
      .status(400)
      .json({ success: false, message: "billing_id and cost are required" });
  }

  try {
    const totalPerUnit = cost;
    const [result] = await db.execute(
      `UPDATE billing SET cost = ?, total = ?, notes = ? WHERE billing_id = ?`,
      [cost, totalPerUnit, notes || null, billing_id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Billing record not found" });
    }

    res.json({
      success: true,
      message: "Billing updated successfully",
      total: totalPerUnit,
    });
  } catch (err) {
    console.error("Error updating billing:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};
