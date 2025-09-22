const db = require('../db');
const queries = require('../Queries/stockQuery');

// ----------------- Create Stock -----------------
exports.createStock = async (req, res) => {
  try {
    let { item_id, current_stock, unit, min_threshold } = req.body;

    current_stock = current_stock ? Number(current_stock) : 0;
    min_threshold = min_threshold ? Number(min_threshold) : 0;

    if (!item_id || !current_stock || !unit) {
      return res.status(400).json({
        success: false,
        error: 'item_id, current_stock, and unit are required.'
      });
    }

    // ✅ Get item_name
    const [[itemRow]] = await db.query(queries.GET_ITEM_NAME, [item_id]);
    if (!itemRow) {
      return res.status(400).json({ success: false, error: "Invalid item_id" });
    }

    // ✅ Insert into stocks
    const [result] = await db.execute(queries.CREATE_STOCK, [
      item_id,
      itemRow.item_name,
      current_stock,
      unit,
      min_threshold
    ]);

    res.status(201).json({ success: true, stock_id: result.insertId });

  } catch (err) {
    console.error('Error creating stock:', err);
    res.status(500).json({ success: false, error: err.message });
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
