const db = require('../db');

// Helper to map status to name
const statusMap = {
  1: 'Active',
  2: 'Inactive',
};

// Create item
exports.createItem = async (req, res) => {
  let { name, type, status } = req.body;

  name = name ?? null;
  type = type ?? null;
  status = status ?? null;

  if (!name || !type || !status) {
    return res.status(400).json({ success: false, error: 'name, type, and status are required.' });
  }

  name = name.toLowerCase();
  type = type.toLowerCase();

  try {
    const [result] = await db.execute(
      `INSERT INTO item_master (item_name, type, status_id, created_date)
       VALUES (?, ?, ?, UNIX_TIMESTAMP())`,
      [name, type, status]
    );

    res.status(201).json({
      success: true,
      data: {
        item_id: result.insertId, // <- item_id included here
        name,
        type,
        status: statusMap[status] || 'Unknown',
      },
    });
  } catch (err) {
    console.error('Error creating item:', err);
     res.status(500).json({ success: false, error: err.message });
  }
};

// Read all items
exports.getItems = async (req, res) => {
  try {
    const [rows] = await db.execute(`SELECT * FROM item_master`);

    const items = rows.map(row => ({
      item_id: row.item_id,  // <- item_id included here
      name: row.item_name,
      type: row.type,
      status: statusMap[row.status_id] || 'Unknown',
    }));

    res.json({ success: true, data: items });
  } catch (err) {
    console.error('Error fetching items:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Read item by ID
exports.updateItem = async (req, res) => {
  const { item_id } = req.params;
  let { name, type, status } = req.body;

  try {
    const fields = [];
    const values = [];

    if (name) {
      name = name.toLowerCase();
      fields.push("item_name=?");
      values.push(name);
    }
    if (type) {
      type = type.toLowerCase();
      fields.push("type=?");
      values.push(type);
    }
    if (status) {
      fields.push("status_id=?");
      values.push(status);
    }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, error: "No fields to update" });
    }

    values.push(item_id); // for WHERE clause

    const [result] = await db.execute(
      `UPDATE item_master SET ${fields.join(", ")}, updated_date=UNIX_TIMESTAMP() WHERE item_id=?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: "Item not found" });
    }

    res.json({
      success: true,
      data: {
        item_id,
        name,
        type,
        status: status ? (statusMap[status] || "Unknown") : undefined,
      },
    });
  } catch (err) {
    console.error("Error updating item:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

exports.getItemById = async (req, res) => {
  const { item_id } = req.params;
  try {
    const [rows] = await db.execute(`SELECT * FROM item_master WHERE item_id=?`, [item_id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    const row = rows[0];
    res.json({
      success: true,
      data: {
        item_id: row.item_id,
        name: row.item_name,
        type: row.type,
        status: statusMap[row.status_id] || 'Unknown',
      },
    });
  } catch (err) {
    console.error('Error fetching item by id:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Update item
exports.updateItem = async (req, res) => {
  const { item_id } = req.params;
  let { name, type, status } = req.body;

  if (name) name = name.toLowerCase();
  if (type) type = type.toLowerCase();

  try {
    await db.execute(
      `UPDATE item_master SET item_name=?, type=?, status_id=?, updated_date=UNIX_TIMESTAMP() WHERE item_id=?`,
      [name, type, status, item_id]
    );

    res.json({
      success: true,
      data: {
        item_id,  // <- item_id included here
        name,
        type,
        status: statusMap[status] || 'Unknown',
      },
    });
  } catch (err) {
    console.error('Error updating item:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// ✅ Delete item
exports.deleteItem = async (req, res) => {
  const { item_id } = req.params;
  try {
    const [result] = await db.execute(
      `DELETE FROM item_master WHERE item_id = ?`,
      [item_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (err) {
    console.error('Error deleting item:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};