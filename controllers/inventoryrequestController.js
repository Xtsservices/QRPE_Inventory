// controllers/inventoryrequestController.js
const db = require("../db");

// =============================
// CREATE REQUEST (with items)
// =============================
exports.createRequest = async (req, res) => {
  const { requested_by, items } = req.body;

  if (!requested_by || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "requested_by and items are required" });
  }

  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    // Validate availability first & compute totals (prevent partial writes)
    let total_price = 0;
    for (const it of items) {
      if (!it.item_id) throw new Error("item_id required for each item");
      if (!it.item_name) throw new Error("item_name required for each item");
      const quantity = Number(it.quantity);
      const price = Number(it.price);
      if (!Number.isFinite(quantity) || quantity <= 0) throw new Error(`Invalid quantity for item ${it.item_name}`);
      if (!Number.isFinite(price) || price < 0) throw new Error(`Invalid price for item ${it.item_name}`);

      // availability check
      const [availableItems] = await conn.query(
        `SELECT * FROM orderitems WHERE item_id = ? AND status = 'available'`,
        [it.item_id]
      );
      if (availableItems.length === 0) {
        throw new Error(`Item with item_id ${it.item_id} not available in stock`);
      }
      total_price += price; // (could be quantity * price if that's desired)
    }
    const item_count = items.length;

    // Insert master request row
    const [result] = await conn.query(
      `INSERT INTO inventory_requests (requested_by, total_price, item_count, request_date)
       VALUES (?, ?, ?, NOW())`,
      [requested_by, total_price, item_count]
    );
    const requestId = result.insertId;

    // Insert items
    for (const it of items) {
      await conn.query(
        `INSERT INTO inventory_request_items (request_id, item_id, item_name, quantity, price)
         VALUES (?, ?, ?, ?, ?)`,
        [requestId, it.item_id, it.item_name, it.quantity, it.price]
      );
    }

    await conn.commit();
    return res.status(201).json({ message: "Request created", request_id: requestId, total_price, item_count });
  } catch (err) {
    if (conn) { try { await conn.rollback(); } catch (rbErr) { console.error("Rollback failed", rbErr); } }
    console.error("Error creating request:", err);
    const status = /not available|required|Invalid/.test(err.message) ? 400 : 500;
    return res.status(status).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
};

// =============================
// GET ALL REQUESTS
// =============================
exports.getRequests = async (req, res) => {
  try {
    const [requests] = await db.query(
      `SELECT ir.id, ir.requested_by, ir.total_price, ir.item_count, ir.request_date
       FROM inventory_requests ir
       ORDER BY ir.request_date DESC`
    );

    const [items] = await db.query(
      `SELECT iri.id, iri.request_id, iri.item_name, iri.quantity, iri.price
       FROM inventory_request_items iri`
    );

    const result = requests.map((r) => ({
      ...r,
      items: items.filter((i) => i.request_id === r.id),
    }));

    res.json(result);
  } catch (err) {
    console.error("Error fetching requests:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// =============================
// GET SINGLE REQUEST
// =============================
exports.getRequestById = async (req, res) => {
  try {
    const requestId = req.params.id;

    const [requests] = await db.query(
      `SELECT id, requested_by, total_price, item_count, request_date
       FROM inventory_requests
       WHERE id = ?`,
      [requestId]
    );

    if (requests.length === 0) {
      return res.status(404).json({ error: "Request not found" });
    }

    const [items] = await db.query(
      `SELECT id, request_id, item_name, quantity, price
       FROM inventory_request_items
       WHERE request_id = ?`,
      [requestId]
    );

    res.json({
      ...requests[0],
      items,
    });
  } catch (err) {
    console.error("Error fetching request:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// =============================
// UPDATE REQUEST
// =============================
exports.updateRequest = async (req, res) => {
  const requestId = req.params.id;
  const { requested_by, items } = req.body;

  try {
    // Update main request
    await db.query(
      `UPDATE inventory_requests 
       SET requested_by = ? 
       WHERE id = ?`,
      [requested_by, requestId]
    );

    if (items && items.length > 0) {
      // Remove old items
      await db.query(
        `DELETE FROM inventory_request_items WHERE request_id = ?`,
        [requestId]
      );

      // Insert new items
      for (const item of items) {
        await db.query(
          `INSERT INTO inventory_request_items (request_id, item_name, quantity, price) 
           VALUES (?, ?, ?, ?)`,
          [requestId, item.item_name, item.quantity, item.price]
        );
      }
    }

    res.json({ message: "Request updated" });
  } catch (err) {
    console.error("Error updating request:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
