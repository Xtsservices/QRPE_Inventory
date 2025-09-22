const db = require("../db");
const queries = require("../Queries/itemsQuery"); // ✅ centralized queries

// Map status_id → status text
const statusMap = {
  1: "Active",
  2: "Inactive",
};

// ===== CREATE ITEM =====
exports.createItem = async (req, res) => {
  let { name, type, units, kg, grams, litres, status_id } = req.body;

  name = name?.trim() ?? null;
  type = type?.trim() ?? null;
  units = units ?? 0;
  kg = kg ?? 0;
  grams = grams ?? 0;
  litres = litres ?? 0;
  status_id = status_id ?? 1;

  if (!name || !type) {
    return res
      .status(400)
      .json({ success: false, error: "Name and type are required." });
  }

  if (kg === 0 && grams === 0 && litres === 0 && units === 0) {
    return res.status(400).json({
      success: false,
      error: "At least one quantity must be provided.",
    });
  }

  try {
    const [result] = await db.execute(
      `INSERT INTO item_master (name, type, status_id, units, kg, grams, litres)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, type, status_id, units, kg, grams, litres]
    );

    res.status(201).json({
      success: true,
      data: {
        item_id: result.insertId,
        name, // ✅ fixed
        type,
        units,
        kg,
        grams,
        litres,
        status_id,
        status: statusMap[status_id] || "Unknown",
      },
    });
  } catch (err) {
    console.error("Error creating item:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ===== GET ALL ITEMS =====
exports.getAllItems = async (req, res) => {
  try {
    const [rows] = await db.execute(queries.GET_ALL_ITEMS);

    const items = rows.map((item) => ({
      item_id: item.item_id,
      name: item.name, // ✅ use correct column
      type: item.type,
      units: item.units,
      kg: item.kg,
      grams: item.grams,
      litres: item.litres,
      cost: item.cost,
      status_id: item.status_id,
      status: statusMap[item.status_id] || "Unknown",
    }));

    res.json({ success: true, data: items });
  } catch (err) {
    console.error("Error fetching items:", err);
    res.status(500).json({ success: false, error: "Failed to fetch items" });
  }
};

// ===== GET ITEM BY ID =====
exports.getItemById = async (req, res) => {
  const { item_id } = req.params;
  try {
    const [rows] = await db.execute(queries.GET_ITEM_BY_ID, [item_id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "Item not found" });
    }
    const row = rows[0];
    res.json({
      success: true,
      data: {
        ...row,
        status: statusMap[row.status_id] || "Unknown",
      },
    });
  } catch (err) {
    console.error("Error fetching item by id:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// ===== UPDATE ITEM =====
exports.updateItem = async (req, res) => {
  try {
    const {
      item_id,
      name, // ✅ use name instead of item_name
      type,
      units,
      kg,
      grams,
      litres,
      status_id,
      cost,
    } = req.body;

    if (!item_id) {
      return res
        .status(400)
        .json({ success: false, error: "Item ID is required" });
    }

    if (
      name === undefined &&
      type === undefined &&
      units === undefined &&
      kg === undefined &&
      grams === undefined &&
      litres === undefined &&
      status_id === undefined &&
      cost === undefined
    ) {
      return res
        .status(400)
        .json({ success: false, error: "No fields to update" });
    }

    let updateFields = [];
    let params = [];

    if (name !== undefined) {
      updateFields.push("name = ?");
      params.push(name.trim());
    }
    if (type !== undefined) {
      updateFields.push("type = ?");
      params.push(type.trim());
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
    if (cost !== undefined) {
      updateFields.push("cost = ?");
      params.push(cost);
    }

    params.push(item_id);

    const sql = queries.UPDATE_ITEM(updateFields);
    const [result] = await db.query(sql, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: "Item not found" });
    }

    return res.json({ success: true, message: "Item updated successfully" });
  } catch (err) {
    console.error("Error updating item:", err);
    return res.status(500).json({ success: false, error: "Server Error" });
  }
};

// ===== SOFT DELETE ITEM =====
exports.deleteItem = async (req, res) => {
  const { item_id } = req.params;
  try {
    const [result] = await db.execute(queries.SOFT_DELETE_ITEM, [item_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: "Item not found" });
    }

    res.json({ success: true, message: "Item marked as inactive" });
  } catch (err) {
    console.error("Error soft deleting item:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};
