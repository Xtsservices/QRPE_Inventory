const db = require('../db'); // <-- this imports your MySQL connection

const statusMap = {
  1: 'Active',
  2: 'Inactive',
};

// ===== CREATE ITEM =====
exports.createItem = async (req, res) => {
  let { name, type, units, kg, grams, litres, status } = req.body;

  name = name?.trim().toLowerCase() ?? null;
  type = type?.trim().toLowerCase() ?? null;
  units = units ?? null;
  kg = kg ?? null;
  grams = grams ?? null;
  litres = litres ?? null;
  status = status ?? 1; // default active

  // Require mandatory fields (only name & type)
  if (!name || !type) {
    return res.status(400).json({
      success: false,
      error: "name and type are required.",
    });
  }

  // At least one quantity field required
  if ((kg === null && grams === null && litres === null && units === null)) {
    return res.status(400).json({
      success: false,
      error: "At least one quantity (unit/kg/grams/litres) must be provided.",
    });
  }

  // Normalize: if kg/grams exist, litres = 0
  if (kg !== null || grams !== null) {
    litres = 0;
    kg = kg ?? 0;
    grams = grams ?? 0;
  } else if (litres !== null) {
    kg = 0;
    grams = 0;
  }

  try {
     const [rows] = await db.execute("SELECT item_id FROM items ORDER BY item_id DESC LIMIT 1");
    let lastId = rows.length ? rows[0].item_id : null;
    let number = lastId ? parseInt(lastId.replace('I', '')) + 1 : 1;
    const item_id = 'I' + number.toString().padStart(3, '0');

    // Insert new item
    const [result] = await db.execute(
      `INSERT INTO items (item_id, item_name, type, units, kg, grams, litres, status_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [item_id, name, type, units, kg, grams, litres, status]
    );

    res.status(201).json({
      success: true,
      data: {
        item_id: result.insertId,
        name,
        type,
        units,
        kg,
        grams,
        litres,
        status_id: status,
        status: statusMap[status] || "Unknown",
      },
    });
  } catch (err) {
    console.error("Error creating item:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ===== READ ALL ITEMS =====
exports.getItems = async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM items");

    const items = rows.map(row => ({
      item_id: row.item_id,
      name: row.item_name,
      type: row.type,
      units: row.units,
      kg: row.kg,
      grams: row.grams,
      litres: row.litres,
      status: statusMap[row.status_id] || "Unknown",
    }));

    res.json({ success: true, data: items });
  } catch (err) {
    console.error("Error fetching items:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// ===== READ ITEM BY ID =====
exports.getItemById = async (req, res) => {
  const { item_id } = req.params;
  try {
    const [rows] = await db.execute(`SELECT * FROM items WHERE item_id=?`, [item_id]);
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
        units: row.units,
        status: statusMap[row.status_id] || 'Unknown',
      },
    });
  } catch (err) {
    console.error('Error fetching item by id:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// ===== UPDATE ITEM =====
exports.updateItem = async (req, res) => {
    try {
        const { item_id, name, type, units, kg, grams, litres, status_id } = req.body;

        // Validate required fields
        if (!item_id) {
            return res.status(400).json({ success: false, error: "Item ID is required" });
        }
        if (!name || !type) {
            return res.status(400).json({ success: false, error: "Name and Type are required" });
        }

        // Build the update query dynamically only for fields that exist
        let updateFields = [];
        let params = [];

        if (name) {
            updateFields.push("item_name = ?");
            params.push(name);
        }
        if (type) {
            updateFields.push("type = ?");
            params.push(type);
        }
        if (units !== undefined) {
            updateFields.push("units = ?");
            params.push(units);
        }
        if (kg !== undefined) {
            updateFields.push("kg = ?");
            params.push(kg);
        }
        if (grams !== undefined) {
            updateFields.push("grams = ?");
            params.push(grams);
        }
        if (litres !== undefined) {
            updateFields.push("litres = ?");
            params.push(litres);
        }
        if (status_id !== undefined) {
            updateFields.push("status_id = ?");
            params.push(status_id);
        }

        // Add the WHERE clause param
        params.push(item_id);

        const sql = `UPDATE items SET ${updateFields.join(", ")} WHERE item_id = ?`;

        const [result] = await db.query(sql, params);

        return res.json({ success: true, message: "Item updated successfully", result });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: "Server Error" });
    }
};


// ===== SOFT DELETE ITEM =====
exports.deleteItem = async (req, res) => {
  const { item_id } = req.params;
  try {
    const [result] = await db.execute(
      `UPDATE items 
       SET status_id = 2, updated_at = NOW() 
       WHERE item_id = ?`,
      [item_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    res.json({ success: true, message: 'Item marked as inactive' });
  } catch (err) {
    console.error('Error soft deleting item:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
