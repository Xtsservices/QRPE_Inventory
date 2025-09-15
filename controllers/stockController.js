const db = require('../db');

// ----------------- Create Stock -----------------
exports.createStock = async (req, res) => {
  try {
    let { item_id, quantity, cost, vendor_id, created_by } = req.body;

    // Convert to numbers or null
    item_id = item_id ? Number(item_id) : null;
    quantity = quantity ? Number(quantity) : null;
    cost = cost ? Number(cost) : null;
    vendor_id = vendor_id ? Number(vendor_id) : null;
    created_by = created_by ? Number(created_by) : null;

    // Validate required fields
    if (!quantity || !cost || !vendor_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'quantity, cost, and vendor_id are required.' 
      });
    }

    // Apply 5x cost if quantity > 200
    if (quantity > 200) cost = cost * 5;

    const [result] = await db.execute(
      `INSERT INTO stock 
       (item_id, quantity, cost, vendor_id, created_by, created_date)
       VALUES (?, ?, ?, ?, ?, UNIX_TIMESTAMP())`,
      [item_id, quantity, cost, vendor_id, created_by]
    );

    res.status(201).json({ success: true, stock_id: result.insertId });

  } catch (err) {
    console.error('Error creating stock:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ----------------- Get Stocks -----------------
exports.getStocks = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        s.stock_id, 
        s.item_id,
        i.item_name, 
        s.quantity,
        IFNULL(i.unit, '-') AS unit,
        IFNULL(i.min_threshold, 0) AS min_threshold,
        s.vendor_id,
        s.cost
      FROM stock s
      LEFT JOIN item_master i ON s.item_id = i.item_id
    `);

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching stocks:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ----------------- Update Stock -----------------
exports.updateStock = async (req, res) => {
  try {
    const { stock_id } = req.params;
    let { item_id, quantity, cost, vendor_id, updated_by } = req.body;

    // Convert to numbers or null
    item_id = item_id ? Number(item_id) : null;
    quantity = quantity ? Number(quantity) : null;
    cost = cost ? Number(cost) : null;
    vendor_id = vendor_id ? Number(vendor_id) : null;
    updated_by = updated_by ? Number(updated_by) : null;

    await db.execute(
      `UPDATE stock 
       SET item_id=?, quantity=?, cost=?, vendor_id=?, updated_by=?, updated_date=UNIX_TIMESTAMP()
       WHERE stock_id=?`,
      [item_id, quantity, cost, vendor_id, updated_by, stock_id]
    );

    res.json({ success: true, message: 'Stock updated successfully' });

  } catch (err) {
    console.error('Error updating stock:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
