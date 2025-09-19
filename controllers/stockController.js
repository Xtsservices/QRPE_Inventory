const db = require('../db');

// ----------------- Create Stock -----------------
exports.createStock = async (req, res) => {
  try {
    let { item_id, current_stock, unit, min_threshold } = req.body;

    // Convert numbers
    current_stock = current_stock ? Number(current_stock) : 0;
    min_threshold = min_threshold ? Number(min_threshold) : 0;

    // Validate required fields
    if (!item_id || !current_stock || !unit) {
      return res.status(400).json({ 
        success: false, 
        error: 'item_id, current_stock, and unit are required.' 
      });
    }

    // Get item_name from items table
    const [[itemRow]] = await db.query(
      "SELECT item_name FROM items WHERE item_id = ?",
      [item_id]
    );

    if (!itemRow) {
      return res.status(400).json({ success: false, error: "Invalid item_id" });
    }

    // Insert into stocks
    const [result] = await db.execute(
      `INSERT INTO stocks 
       (item_id, item_name, current_stock, unit, min_threshold, status, created_at) 
       VALUES (?, ?, ?, ?, ?, 'Available', NOW())`,
      [item_id, itemRow.item_name, current_stock, unit, min_threshold]
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
      SELECT stock_id, item_id, item_name, current_stock, unit, min_threshold, created_at, updated_at
      FROM stocks
    `);

    // Auto-calculate status
    const data = rows.map(row => {
      let status = 'Available';
      if (row.current_stock === 0) status = 'Out of Stock';
      else if (row.current_stock < row.min_threshold) status = 'Low Stock';

      return { ...row, status };
    });

    res.json({ success: true, data });
  } catch (err) {
    console.error('Error fetching stocks:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ----------------- Update Stock -----------------
exports.updateStock = async (req, res) => {
  try {
    const { stock_id } = req.params;
    let { item_id, current_stock, unit, min_threshold } = req.body;

    current_stock = current_stock ? Number(current_stock) : 0;
    min_threshold = min_threshold ? Number(min_threshold) : 0;

    await db.execute(
      `UPDATE stocks
       SET item_id=?, current_stock=?, unit=?, min_threshold=?, updated_at=NOW()
       WHERE stock_id=?`,
      [item_id, current_stock, unit, min_threshold, stock_id]
    );

    res.json({ success: true, message: "Stock updated successfully" });

  } catch (err) {
    console.error("Error updating stock:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
