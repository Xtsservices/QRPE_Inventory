const db = require("../db");

// ----------------- Create Order -----------------
exports.createOrder = async (req, res) => {
  let { vendorName, vendorId, date, items, status, totalAmount, notes } = req.body;

  // Normalize values
  vendorName = vendorName ?? null;
  vendorId = vendorId ?? null;
  date = date ?? new Date();
  items = items ?? [];
  status = status ?? "Pending";
  totalAmount = totalAmount ?? 0;
  notes = notes ?? "";

  if (!vendorName || !vendorId || !items.length) {
    return res.status(400).json({
      success: false,
      error: "vendorName, vendorId and items are required.",
    });
  }

  try {
    const itemCount = items.length;
    const itemsJSON = JSON.stringify(items);

    // Insert order with vendor_id
    const [result] = await db.execute(
      `INSERT INTO orders (vendor_name, vendor_id, date, item_count, status, amount, notes, items, created_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, UNIX_TIMESTAMP())`,
      [vendorName, vendorId, date, itemCount, status, totalAmount, notes, itemsJSON]
    );

    // Generate order_id
    const order_id = "ORD" + result.insertId.toString().padStart(3, "0");

    // Update row with order_id
await db.execute(
  `UPDATE orders 
   SET vendor_name=?, vendor_id=?, date=?, item_count=?, status=?, amount=?, notes=?, items=?, updated_date=UNIX_TIMESTAMP()
   WHERE order_id=?`,
  [
    vendorName,
    vendorId,
    date,
    itemCount,
    status,
    totalAmount,
    notes,
    itemsJSON,
    order_id,
  ]
);

    // Update stock
    for (const item of items) {
      const { id: item_id, quantity, cost } = item;

      const [existing] = await db.execute(
        `SELECT stock_id, quantity FROM stock WHERE item_id=? AND vendor_id=?`,
        [item_id, vendorId]
      );

      if (existing.length > 0) {
        await db.execute(
          `UPDATE stock SET quantity = quantity + ?, updated_date=UNIX_TIMESTAMP() WHERE stock_id=?`,
          [quantity, existing[0].stock_id]
        );
      } else {
        await db.execute(
          `INSERT INTO stock (item_id, quantity, cost, vendor_id, created_date)
           VALUES (?, ?, ?, ?, UNIX_TIMESTAMP())`,
          [item_id, quantity, cost || 0, vendorId]
        );
      }
    }

    res.status(201).json({
      success: true,
      order: {
        id: order_id,
        vendorName,
        vendorId,
        date,
        itemCount,
        status,
        totalAmount,
        notes,
        items,
      },
    });
  } catch (err) {
    console.error("Error creating order:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// ----------------- Get All Orders -----------------
exports.getOrders = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT o.order_id, o.vendor_id, o.vendor_name, v.contact_person, v.contact_mobile, 
              o.date, o.item_count, o.status, o.amount, o.notes, o.items 
       FROM orders o
       LEFT JOIN vendors v ON o.vendor_id = v.vendor_id
       ORDER BY o.created_date DESC`
    );

    const data = rows.map((row) => ({
      id: row.order_id,
      vendorId: row.vendor_id,
      vendorName: row.vendor_name,
      vendorContact: row.contact_person,
      vendorMobile: row.contact_mobile,
      date: row.date,
      itemCount: row.item_count,
      status: row.status,
      totalAmount: row.amount,
      notes: row.notes,
      items: JSON.parse(row.items),
    }));

    res.json({ success: true, data });
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// ----------------- Get Single Order -----------------
exports.getOrderById = async (req, res) => {
  const { order_id } = req.params;

  try {
    const [rows] = await db.execute(
      `SELECT o.order_id, o.vendor_id, o.vendor_name, v.contact_person, v.contact_mobile,
              o.date, o.item_count, o.status, o.amount, o.notes, o.items
       FROM orders o
       LEFT JOIN vendors v ON o.vendor_id = v.vendor_id
       WHERE o.order_id=?`,
      [order_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    const row = rows[0];
    const order = {
      id: row.order_id,
      vendorId: row.vendor_id,
      vendorName: row.vendor_name,
      vendorContact: row.contact_person,
      vendorMobile: row.contact_mobile,
      date: row.date,
      itemCount: row.item_count,
      status: row.status,
      totalAmount: row.amount,
      notes: row.notes,
      items: JSON.parse(row.items),
    };

    res.json({ success: true, data: order });
  } catch (err) {
    console.error("Error fetching order:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// ----------------- Update Order -----------------
exports.updateOrder = async (req, res) => {
  const { order_id } = req.params;
  let { vendorName, vendorId, date, items, status, totalAmount, notes } = req.body;

  // 🔹 Normalize inputs (convert undefined → null or default values)
  vendorName = vendorName ?? null;
  vendorId = vendorId ?? null;
  date = date ?? new Date();
  items = items ?? [];
  status = status ?? "Pending";
  totalAmount = totalAmount ?? 0;
  notes = notes ?? "";

  try {
    const itemCount = items.length;
    const itemsJSON = JSON.stringify(items);

    // Debugging: see what values you're sending
    console.log({
      vendorName,
      vendorId,
      date,
      itemCount,
      status,
      totalAmount,
      notes,
      itemsJSON,
      order_id
    });

    await db.execute(
      `UPDATE orders 
       SET vendor_name=?, vendor_id=?, date=?, item_count=?, status=?, amount=?, notes=?, items=?, updated_date=UNIX_TIMESTAMP()
       WHERE order_id=?`,
      [
        vendorName,
        vendorId,
        date,
        itemCount,
        status,
        totalAmount,
        notes,
        itemsJSON,
        order_id,
      ]
    );

    res.json({ success: true, message: "Order updated successfully" });
  } catch (err) {
    console.error("Error updating order:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};


// ----------------- Delete Order -----------------
exports.deleteOrder = async (req, res) => {
  const { order_id } = req.params;

  try {
    // Get old order
    const [oldRows] = await db.execute(
      `SELECT items, vendor_id FROM orders WHERE order_id=?`,
      [order_id]
    );

    if (oldRows.length === 0) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    const oldOrder = oldRows[0];
    const oldItems = JSON.parse(oldOrder.items);

    // Rollback stock
    for (const item of oldItems) {
      await db.execute(
        `UPDATE stock SET quantity = quantity - ? WHERE item_id=? AND vendor_id=?`,
        [item.quantity, item.id, oldOrder.vendor_id]
      );
    }

    // Delete order
    await db.execute(`DELETE FROM orders WHERE order_id=?`, [order_id]);

    res.json({ success: true, message: "Order deleted successfully" });
  } catch (err) {
    console.error("Error deleting order:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};
