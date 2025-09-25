const db = require('../db');
const queries = require('../Queries/stockQuery');

// ----------------- Create Stock -----------------
exports.createStock = async (req, res) => {
  try {
    const { item_id, current_stock, unit, min_threshold } = req.body;

    if (!item_id || !current_stock || !unit || !min_threshold) {
      return res.status(400).json({ success: false, error: "All fields are required" });
    }

    const [result] = await db.query(queries.CREATE_STOCK, [
      item_id,
      current_stock,
      unit,
      min_threshold
    ]);

    res.json({ success: true, stock_id: result.insertId });
  } catch (err) {
    console.error("Error creating stock:", err);
    res.status(500).json({ success: false, error: "Failed to create stock" });
  }
};

// ----------------- Get Stocks -----------------
exports.getStocks = async (req, res) => {
  try {
    const [rows] = await db.query(queries.GET_STOCKS);

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

    await db.execute(queries.UPDATE_STOCK, [
      item_id,
      current_stock,
      unit,
      min_threshold,
      stock_id
    ]);

    res.json({ success: true, message: "Stock updated successfully" });
  } catch (err) {
    console.error("Error updating stock:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
