const db = require("../db");
const { createRequestSchema, updateRequestSchema } = require("../Validations/inventoryrequestValidation");

// CREATE REQUEST (with items)
exports.createRequest = async (req, res) => {
  const { error } = createRequestSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      errors: error.details.map((err) => err.message)
    });
  }

  const { requested_by, items } = req.body;

  try {
    // Calculate totals
    const total_price = items.reduce((sum, item) => sum + (item.price || 0), 0);
    const item_count = items.length;

    const [result] = await db.query(
      `INSERT INTO inventory_requests (requested_by, total_price, item_count, request_date) 
   VALUES (?, ?, ?, NOW())`, // add NOW() here
      [requested_by, total_price, item_count]
    );

    const requestId = result.insertId;

    for (const item of items) {
      await db.query(
        `INSERT INTO inventory_request_items (request_id, item_name, quantity, price) 
         VALUES (?, ?, ?, ?)`,
        [requestId, item.item_name, item.quantity, item.price]
      );
    }

    res.status(201).json({ message: "Request created", request_id: requestId });
  } catch (err) {
    console.error("Error creating request:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET ALL REQUESTS
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

// GET SINGLE REQUEST
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

// UPDATE REQUEST
exports.updateRequest = async (req, res) => {
  const { error } = updateRequestSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      errors: error.details.map((err) => err.message)
    });
  }

  const requestId = req.params.id;
  const { requested_by, items } = req.body;

  try {
    await db.query(
      `UPDATE inventory_requests 
       SET requested_by = ? 
       WHERE id = ?`,
      [requested_by, requestId]
    );

    if (items && items.length > 0) {
      await db.query(
        `DELETE FROM inventory_request_items WHERE request_id = ?`,
        [requestId]
      );

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
