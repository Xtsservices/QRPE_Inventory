const db = require("../db");
const orderQueries = require("../Queries/orderQuery");

// ----------------- CREATE ORDER -----------------
exports.createOrder = async (req, res) => {
  const { vendor_name, date, items, status, notes } = req.body;

  if (!vendor_name || !items || !items.length) {
    return res.status(400).json({
      success: false,
      error: "Vendor name and at least one item are required",
    });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Insert order with initial total = 0
    const [orderResult] = await conn.query(orderQueries.insertOrder, [
      vendor_name,
      date || new Date(),
      status || "Pending",
      0,
      notes || "-",
    ]);

    const orderId = orderResult.insertId;
    let total = 0;

    // Insert items & calculate total
    for (const item of items) {
      const itemName = item.item_name || item.name;
      const unit = item.unit || null;
      const quantity = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;

      if (!itemName)
        throw new Error("Item name is required for each order item");

      total += price;

      await conn.query(orderQueries.insertOrderItem, [
        orderId,
        itemName,
        unit,
        quantity,
        price,
      ]);
    }

    // Update total in orders table
    await conn.query("UPDATE orders SET total = ? WHERE order_id = ?", [
      total,
      orderId,
    ]);

    await conn.commit();
    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order_id: orderId,
    });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ success: false, error: error.message });
  } finally {
    conn.release();
  }
};

// ----------------- UPDATE ORDER -----------------
exports.updateOrder = async (req, res) => {
  const { order_id } = req.params;
  const { vendor_name, status, items } = req.body;

  if (!order_id) {
    return res.status(400).json({ success: false, error: "Order ID required" });
  }
  if (!items || !items.length) {
    return res
      .status(400)
      .json({ success: false, error: "At least one item required" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Delete old items
    await conn.query("DELETE FROM order_items WHERE order_id = ?", [order_id]);

    let total = 0;
    // Insert updated items & recalc total
    for (const item of items) {
      const itemName = item.item_name || item.item;
      const unit = item.unit || null;
      const quantity = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;

      if (!itemName)
        throw new Error("Item name is required for each order item");

      total += price;

      await conn.query(
        "INSERT INTO order_items (order_id, item_name, unit, quantity, price) VALUES (?, ?, ?, ?, ?)",
        [order_id, itemName, unit, quantity, price]
      );
    }

    // Update orders table
    await conn.query(
      "UPDATE orders SET vendor_name = ?, status = ?, total = ? WHERE order_id = ?",
      [vendor_name, status, total, order_id]
    );

    await conn.commit();
    res.json({ success: true, message: "Order updated successfully" });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    conn.release();
  }
};

// ----------------- GET ALL ORDERS -----------------
exports.getOrders = async (req, res) => {
  try {
    const [rows] = await db.query(orderQueries.getAllOrders);

    const orders = rows.map((r) => ({
      ...r,
      items: JSON.parse(r.items || "[]"),
    }));

    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ----------------- GET ORDER BY ID -----------------
exports.getOrderById = async (req, res) => {
  try {
    const { order_id } = req.params;
    const [rows] = await db.query(orderQueries.getOrderById, [order_id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Order not found or deleted",
      });
    }

    const order = rows[0];
    order.items = JSON.parse(order.items || "[]");

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ----------------- SOFT DELETE ORDER -----------------
exports.deleteOrder = async (req, res) => {
  const { order_id } = req.params;
  try {
    const [result] = await db.query(orderQueries.softDeleteOrder, [order_id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: "Order not found or already deleted",
      });
    }
    res.json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
