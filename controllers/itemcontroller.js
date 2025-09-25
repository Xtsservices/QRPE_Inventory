const db = require("../db");
const queries = require("../Queries/itemsQuery"); // ✅ centralized queries

// Map status_id → status text
const statusMap = {
  1: "Active",
  2: "Inactive",
};

// ===== CREATE ITEM =====
exports.createItem = async (req, res) => {
  try {
    const { name, type, units, quantity, cost, status_id } = req.body;

   const [result] = await db.query(
  queries.CREATE_ITEM,
  [name, type, status_id, quantity, units, cost]
);
    res.status(201).json({
      success: true,
      data: {
        item_id: result.insertId,
        name,
        type,
        units,
        quantity,
        quantity_with_unit: `${quantity}${units}`,
        cost,
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
      name: item.name,
      type: item.type,
      units: item.units,
      // overwrite quantity with combined value
      quantity_with_unit: item.quantity_with_unit,
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
        item_id: row.item_id,
        name: row.name,
        type: row.type,
        // overwrite quantity with combined value
        quantity_with_unit: row.quantity_with_unit,
        units: row.units,
        cost: row.cost,
        status_id: row.status_id,
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
    const { item_id } = req.params;
    const { name, type, units, quantity, cost, status_id } = req.body;

    let updateFields = [];
    let params = [];

    if (name !== undefined) {
      updateFields.push("name = ?");
      params.push(name);
    }
    if (type !== undefined) {
      updateFields.push("`type` = ?");
      params.push(type);
    }
    if (units !== undefined) {
      updateFields.push("units = ?");
      params.push(units);
    }
    if (quantity !== undefined) {
      updateFields.push("quantity = ?");
      params.push(quantity);
    }
    if (cost !== undefined) {
      updateFields.push("cost = ?");
      params.push(cost);
    }
    if (status_id !== undefined) {
      updateFields.push("status_id = ?");
      params.push(status_id);
    }

     // no fields to update
    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, error: "No fields to update" });
    }

    params.push(item_id);

    const sql = queries.UPDATE_ITEM(updateFields);
    const [result] = await db.query(sql, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: "Item not found" });
    }

    const [rows] = await db.query(queries.GET_ITEM_BY_ID, [item_id]);
    const updated = rows[0];

    return res.json({
      success: true,
      data: updated, // ✅ directly return row (already includes type, quantity_with_unit, status etc.)
    });
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
