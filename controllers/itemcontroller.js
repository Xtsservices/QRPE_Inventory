const db = require('../db');

// Create item
exports.createItem = async (req, res) => {
  let { item_name, unit, status_id, created_by } = req.body;
  const allowedUnits = ['ML', 'GRMMS'];
  item_name = item_name ?? null;
  unit = unit ?? null;
  status_id = status_id ?? null;
  created_by = created_by ?? null;
  if (!item_name || !unit || !status_id) {
    return res.status(400).json({ success: false, error: 'item_name, unit, and status_id are required.' });
  }
  if (!allowedUnits.includes(unit.toUpperCase())) {
    return res.status(400).json({ success: false, error: 'unit must be either ML or GRMms.' });
  }
  item_name = item_name.toLowerCase();
  try {
    const [result] = await db.execute(
      `INSERT INTO item_master (item_name, unit, status_id, created_by, created_date)
       VALUES (?, ?, ?, ?, UNIX_TIMESTAMP())`,
      [item_name, unit, status_id, created_by]
    );
    res.status(201).json({ success: true, item_id: result.insertId });
  } catch (err) {
    console.error('Error creating item:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Read all items
exports.getItems = async (req, res) => {
  try {
    const [rows] = await db.execute(`SELECT * FROM item_master`);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching items:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Update item
exports.updateItem = async (req, res) => {
  const { item_id } = req.params;
  let { item_name, unit, status_id, updated_by } = req.body;
  if (item_name) {
    item_name = item_name.toLowerCase();
  }
  try {
    await db.execute(
      `UPDATE item_master SET item_name=?, unit=?, status_id=?, updated_by=?, updated_date=UNIX_TIMESTAMP() WHERE item_id=?`,
      [item_name, unit, status_id, updated_by, item_id]
    );
    res.json({ success: true, message: 'Item updated successfully' });
  } catch (err) {
    console.error('Error updating item:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};