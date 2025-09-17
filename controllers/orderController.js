const db = require("../db");

// ----------------- CREATE ORDER -----------------
exports.createOrder = async (req, res) => {
  const { order_id, vendor, date, items, status, total } = req.body;

  if (!order_id || !vendor || !items || !total) {
    return res.status(400).json({
      success: false,
      error: "order_id, vendor_name, items, and total are required."
    });
  }

  try {
    const itemsJSON = Array.isArray(items) ? JSON.stringify(items) : items;

    await db.execute(
      `INSERT INTO orders (order_id, vendor_name, date, items, status, total)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [order_id, vendor_name, date || new Date(), itemsJSON, status || "Pending", total]
    );

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: { 
        id: order_id,
        vendorName: vendor_name,
        date: date||new Date(), 
        items, 
        status: status|| "Pending",
        total 
      }
    });
  } catch (err) {
    console.error("Error creating order:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// ----------------- GET ALL ORDERS -----------------
exports.getOrders = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT * FROM orders ORDER BY date DESC`
    );

    const data = rows.map(row => ({
      order_id: row.order_id,
      vendor_name: row.vendor_name,
      date: row.date,
      items: JSON.parse(row.items),
      status: row.status,
      total: row.total
    }));

    res.json({ success: true, data });
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// ----------------- GET ORDER BY ID -----------------
exports.getOrderById = async (req, res) => {
  const { order_id } = req.params;

  try {
    const [rows] = await db.execute(
      `SELECT * FROM orders WHERE order_id = ?`,
      [order_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    const row = rows[0];

    res.json({
      success: true,
      data: {
        order_id: row.order_id,
        vendor_name: row.vendor_name,
        date: row.date,
        items: JSON.parse(row.items),
        status: row.status,
        total: row.total
      }
    });
  } catch (err) {
    console.error("Error fetching order:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// ----------------- UPDATE ORDER -----------------
exports.updateOrder = async (req, res) => {
  const { order_id } = req.params;
  const { vendor_name, date, items, status, total } = req.body;

  if (!vendor_name && !items && !status && !total) {
    return res.status(400).json({ success: false, error: "No fields to update" });
  }

  try {
    const fields = [];
    const values = [];

    if (vendor) {
      fields.push("vendor_name=?");
      values.push(vendor_name);
    }
    if (items) {
      fields.push("items=?");
      values.push(JSON.stringify(items));
    }
    if (status) {
      fields.push("status=?");
      values.push(status);
    }
    if (total !== undefined) {
      fields.push("total=?");
      values.push(total);
    }
    if (date) {
      fields.push("date=?");
      values.push(date);
    }

    values.push(order_id);

    const [result] = await db.execute(
      `UPDATE orders SET ${fields.join(", ")} WHERE order_id=?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    res.json({ success: true, message: "Order updated successfully" });
  } catch (err) {
    console.error("Error updating order:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// ----------------- SOFT DELETE ORDER -----------------
exports.deleteOrder = async (req, res) => {
  const { order_id } = req.params;

  try {
    const [rows] = await db.execute(
      `SELECT status FROM orders WHERE order_id=?`,
      [order_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    if (rows[0].status === "Cancelled") {
      return res.status(400).json({ success: false, error: "Order is already cancelled" });
    }

    await db.execute(
      `UPDATE orders SET status='Cancelled' WHERE order_id=?`,
      [order_id]
    );

    res.json({ success: true, message: "Order marked as cancelled (soft delete)" });
  } catch (err) {
    console.error("Error soft deleting order:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};
