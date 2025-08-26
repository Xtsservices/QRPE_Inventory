const db = require('../db');

// Create stock
exports.createStock = async (req, res) => {
  let { item_id, quantity, cost, vendor_id, created_by } = req.body;

  // Convert undefined to null for SQL
  item_id = item_id ?? null;
  quantity = quantity ?? null;
  cost = cost ?? null;
  vendor_id = vendor_id ?? null;
  created_by = created_by ?? null;

  // Apply 5x cost if quantity > 200
  if (quantity > 200) {
    cost = cost * 5;
  }

  // Remove item_id from mandatory check
  if (!quantity || !cost || !vendor_id) {
    return res.status(400).json({ success: false, error: 'quantity, cost, and vendor_id are required.' });
  }
  try {
    const [result] = await db.execute(
      `INSERT INTO stock (item_id, quantity, cost, vendor_id, created_by, created_date)
       VALUES (?, ?, ?, ?, ?, UNIX_TIMESTAMP())`,
      [item_id, quantity, cost, vendor_id, created_by]
    );
    res.status(201).json({ success: true, stock_id: result.insertId });
  } catch (err) {
    console.error('Error creating stock:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Read all stocks
exports.getStocks = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT s.*, v.vendor_name, i.item_name 
       FROM stock s 
       JOIN vendor v ON s.vendor_id = v.vendor_id
       JOIN item_master i ON s.item_id = i.item_id`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching stocks:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Update stock
exports.updateStock = async (req, res) => {
  const { stock_id } = req.params;
  let { item_id, quantity, cost, vendor_id, updated_by } = req.body;

  // Convert undefined to null for SQL
  item_id = item_id ?? null;
  quantity = quantity ?? null;
  cost = cost ?? null;
  vendor_id = vendor_id ?? null;
  updated_by = updated_by ?? null;

  try {
    await db.execute(
      `UPDATE stock SET item_id=?, quantity=?, cost=?, vendor_id=?, updated_by=?, updated_date=UNIX_TIMESTAMP() WHERE stock_id=?`,
      [item_id, quantity, cost, vendor_id, updated_by, stock_id]
    );
    res.json({ success: true, message: 'Stock updated successfully' });
  } catch (err) {
    console.error('Error updating stock:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

