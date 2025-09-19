const db = require("../db");

// ----------------- CREATE ORDER -----------------
exports.createOrder = async (req, res) => {
  const { vendor_name, date, items, status } = req.body;

  if (!vendor_name || !items) {
    return res.status(400).json({
      success: false,
      error: "vendor_name and items are required."
    });
  }

  try {
    const itemsArray = Array.isArray(items) ? items : JSON.parse(items);

    // ✅ Calculate total
    const orderTotal = itemsArray.reduce((sum, it) => {
      const qty = Number(it.quantity) || 0;
      const price = Number(it.price) || 0;
      return sum + qty * price;
    }, 0);

    // ✅ Insert into orders
    const [result] = await db.execute(
      `INSERT INTO orders (vendor_name, date, status, total)
       VALUES (?, ?, ?, ?)`,
      [vendor_name, date || new Date(), status || "Pending", orderTotal]
    );
    const newOrderId = result.insertId;

    // ✅ Fetch vendor_id once
    const [vendorRows] = await db.execute(
      "SELECT vendor_id FROM vendors WHERE vendor_name=? LIMIT 1",
      [vendor_name]
    );
    if (!vendorRows.length) throw new Error("Vendor not found");
    const vendorId = vendorRows[0].vendor_id;

    // 🔄 Loop items
    for (const it of itemsArray) {
      let itemId = it.item_id;
      const itemName = it.name || it.item_name || it.item;
      const qty = Number(it.quantity) || 1;
      const price = Number(it.price) || 0;

      // ✅ Ensure item exists in DB
      let cost = 0;
      if (itemId) {
        const [rows] = await db.execute(`SELECT cost FROM items WHERE item_id=? LIMIT 1`, [itemId]);
        if (!rows.length) throw new Error(`Item not found for id=${itemId}`);
        cost = rows[0].cost;
      } else {
        const [rows] = await db.execute(`SELECT item_id, cost FROM items WHERE item_name=? LIMIT 1`, [itemName]);
        if (!rows.length) throw new Error(`Item not found for name=${itemName}`);
        itemId = rows[0].item_id;
        cost = rows[0].cost;
      }

      const total = qty * cost;

      // ✅ Insert into order_items (for view/edit)
await db.execute(
  `INSERT INTO order_items (order_id, item_name, quantity, price)
   VALUES (?, ?, ?, ?)`,
  [newOrderId, itemName, qty, cost]
);

      // ✅ Insert into billing
      await db.execute(
        `INSERT INTO billing (order_id, vendor_id, item_id, quantity, cost, total, status, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, NULL)`,
        [newOrderId, vendorId, itemId, qty, cost, total, status || "Pending"]
      );
    }

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: {
        id: newOrderId,
        vendor_name,
        date: date || new Date(),
        items: itemsArray,
        status: status || "Pending",
        total: orderTotal.toFixed(2)
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
    const [rows] = await db.execute(`
      SELECT 
          o.order_id,
          o.vendor_name,
          o.date,
          o.status,
          o.total,
          CONCAT(
            '[',
            IFNULL(
              GROUP_CONCAT(
                CONCAT(
                  '{"name":"', REPLACE(IFNULL(oi.item_name,''), '"','\\"'), '"',
                  ',"quantity":', IFNULL(oi.quantity, 0),
                  ',"price":', IFNULL(oi.price, 0),
                  '}'
                )
                SEPARATOR ','
              ),
              ''
            ),
            ']'
          ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      GROUP BY o.order_id, o.vendor_name, o.date, o.status, o.total
      ORDER BY o.date DESC
    `);

    const orders = rows.map(order => ({
      ...order,
      items: order.items ? JSON.parse(order.items) : []
    }));

    res.json(orders);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// ----------------- GET ORDER BY ID -----------------
exports.getOrderById = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.execute(`
      SELECT 
          o.order_id,
          o.vendor_name,
          o.date,
          o.status,
          o.total,
          CONCAT(
            '[',
            IFNULL(
              GROUP_CONCAT(
                CONCAT(
                  '{"name":"', REPLACE(IFNULL(oi.item_name,''), '"','\\"'), '"',
                  ',"quantity":', IFNULL(oi.quantity, 0),
                  ',"price":', IFNULL(oi.price, 0),
                  '}'
                )
                SEPARATOR ','
              ),
              ''
            ),
            ']'
          ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      WHERE o.order_id = ?
      GROUP BY o.order_id, o.vendor_name, o.date, o.status, o.total
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    const order = {
      ...rows[0],
      items: rows[0].items ? JSON.parse(rows[0].items) : []
    };

    res.json(order);
  } catch (err) {
    console.error("Error fetching order:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// ----------------- UPDATE ORDER -----------------
exports.updateOrder = async (req, res) => {
  const { order_id } = req.params;
  const { vendor_name, date, items, status, total } = req.body;

  if (!vendor_name && !items && !status && !total && !date) {
    return res.status(400).json({ success: false, error: "No fields to update" });
  }

  try {
    const fields = [];
    const values = [];

    if (vendor_name) {
      fields.push("vendor_name=?");
      values.push(vendor_name);
    }
  if (status) {
  await db.execute(
    `UPDATE billing SET status = ? WHERE order_id = ?`,
    [status === "Complete" ? "Paid" : status, order_id]
  );
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

    if (items) {
      const itemsArray = Array.isArray(items) ? items : JSON.parse(items);

      // Clear old items & billing
      await db.execute(`DELETE FROM order_items WHERE order_id=?`, [order_id]);
      await db.execute(`DELETE FROM billing WHERE order_id=?`, [order_id]);

      for (const it of itemsArray) {
        let itemName = it.name || it.item_name || it.item;
        let qty = it.quantity || 1;
        let price = it.price || 0;

        // Insert into order_items (this keeps selling price)
        await db.execute(
          `INSERT INTO order_items (order_id, item_name, quantity, price)
           VALUES (?, ?, ?, ?)`,
          [order_id, itemName, qty, price]
        );

        // Fetch vendor_id
        const [vendorRow] = await db.execute(
          `SELECT vendor_id FROM vendors WHERE vendor_name=? LIMIT 1`,
          [vendor_name]
        );
        const vendorId = vendorRow.length ? vendorRow[0].vendor_id : null;

        // Fetch item_id + cost
        const [itemRow] = await db.execute(
          `SELECT item_id, cost FROM items WHERE item_name=? LIMIT 1`,
          [itemName]
        );
        if (!itemRow.length) continue;
        const itemId = itemRow[0].item_id;
        const cost = itemRow[0].cost;
        const totalLine = qty * cost;

        // Insert into billing (uses cost, not price)
        await db.execute(
          `INSERT INTO billing (order_id, vendor_id, item_id, quantity, cost, total, status, notes)
           VALUES (?, ?, ?, ?, ?, ?, 'Pending', NULL)`,
          [order_id, vendorId, itemId, qty, cost, totalLine]
        );
      }
    }

    res.json({ success: true, message: "Order updated successfully (with billing updated)" });
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

    // Cancel order
    await db.execute(
      `UPDATE orders SET status='Cancelled' WHERE order_id=?`,
      [order_id]
    );

    // Cancel billing linked to order
    await db.execute(
      `UPDATE billing SET status='Cancelled' WHERE order_id=?`,
      [order_id]
    );

    res.json({ success: true, message: "Order & billing marked as cancelled" });
  } catch (err) {
    console.error("Error soft deleting order:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};