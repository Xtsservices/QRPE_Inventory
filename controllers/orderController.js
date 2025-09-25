const db = require("../db");
const orderQueries = require("../Queries/orderQuery");

// ----------------- CREATE ORDER -----------------
exports.createOrder = async (req, res) => {
  const { vendor_name, date, items, status, notes, vendor_id } = req.body;

  // Basic payload validation
  if (!vendor_name || !vendor_id || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      error: "Vendor name, vendor ID, and at least one item are required",
    });
  }

  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction(); // START TRANSACTION

    // Normalize date (if column expects DATE only you may slice(0,10))
    const orderDate = date ? new Date(date) : new Date();

    // Insert order with temporary total = 0 (will update after items processed)
    const [orderResult] = await conn.query(orderQueries.insertOrder, [
      vendor_name,
      vendor_id,
      orderDate,
      status || "Pending",
      0,
      notes || "-",
    ]);

    const orderId = orderResult.insertId;
    let total = 0; // Will accumulate quantity * price

    for (const rawItem of items) {
      // Extract & validate
      const itemId = rawItem.item_id || null;
      const itemName = rawItem.item_name || rawItem.name;
      const unit = rawItem.unit || null;
      const quantity = Number(rawItem.quantity);
      const price = Number(rawItem.price); // assumed unit price

      if (!itemName) throw new Error("Item name is required for each order item");
      if (!Number.isFinite(quantity) || quantity <= 0)
        throw new Error(`Invalid quantity for item '${itemName}'`);
      if (!Number.isFinite(price) || price < 0)
        throw new Error(`Invalid price for item '${itemName}'`);

      const lineTotal = quantity * price;
      total += lineTotal;

      await conn.query(orderQueries.insertOrderItem, [
        orderId,
        itemId,
        itemName,
        unit,
        quantity,
        price, // storing unit price (line total can be derived later)
        
      ]);
    }

    // Persist computed total
    await conn.query("UPDATE orders SET total = ? WHERE order_id = ?", [total, orderId]);

    await conn.commit(); // COMMIT
    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      order_id: orderId,
      total,
    });
  } catch (error) {
    if (conn) {
      try { await conn.rollback(); } catch (rbErr) { console.error("Rollback failed", rbErr); }
    }
    return res.status(500).json({ success: false, error: error.message });
  } finally {
    if (conn) conn.release();
  }
};

// ----------------- UPDATE ORDER -----------------
exports.updateOrder = async (req, res) => {
  const { order_id } = req.params;
  const { vendor_name, status, items } = req.body;

  if (!order_id) return res.status(400).json({ success: false, error: "Order ID required" });
  if (!vendor_name) return res.status(400).json({ success: false, error: "Vendor name required" });
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, error: "At least one item required" });
  }

  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    // Strategy: update existing items by item_id. If you also need to add new ones, detect missing item_id and insert instead.
    let total = 0;
    for (const rawItem of items) {
      const itemId = rawItem.item_id; // required to match existing row
      const itemName = rawItem.item_name || rawItem.name;
      const unit = rawItem.unit || null;
      const quantity = Number(rawItem.quantity);
      const price = Number(rawItem.price);

      if (!itemId) throw new Error("item_id is required to update an order item");
      if (!itemName) throw new Error("Item name is required for each order item");
      if (!Number.isFinite(quantity) || quantity <= 0)
        throw new Error(`Invalid quantity for item '${itemName}'`);
      if (!Number.isFinite(price) || price < 0)
        throw new Error(`Invalid price for item '${itemName}'`);

      const lineTotal = quantity * price;
      total += lineTotal;

      const [updateRes] = await conn.query(
        "UPDATE order_items SET item_name = ?, unit = ?, quantity = ?, price = ? WHERE order_id = ? AND item_id = ?",
        [itemName, unit, quantity, price, order_id, itemId]
      );
      if (updateRes.affectedRows === 0) {
        // Optional: Insert if not exists (upsert behavior)
        await conn.query(
          "INSERT INTO order_items (order_id, item_id, item_name, unit, quantity, price) VALUES (?, ?, ?, ?, ?, ?)",
          [order_id, itemId, itemName, unit, quantity, price]
        );
      }
    }

    await conn.query(
      "UPDATE orders SET vendor_name = ?, status = ?, total = ? WHERE order_id = ?",
      [vendor_name, status || 'Pending', total, order_id]
    );

    await conn.commit();
    return res.json({ success: true, message: "Order updated successfully", order_id, total });
  } catch (err) {
    if (conn) {
      try { await conn.rollback(); } catch (rbErr) { console.error("Rollback failed", rbErr); }
    }
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    if (conn) conn.release();
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
