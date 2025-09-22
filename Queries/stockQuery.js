// ----------------- Stock Queries -----------------
exports.CREATE_STOCK = `
  INSERT INTO stocks 
  (item_id, item_name, current_stock, unit, min_threshold, status, created_at) 
  VALUES (?, ?, ?, ?, ?, 'Available', NOW())
`;

exports.GET_ITEM_NAME = `
  SELECT item_name FROM items WHERE item_id = ?
`;

exports.GET_STOCKS = `
  SELECT stock_id, item_id, item_name, current_stock, unit, min_threshold, created_at, updated_at
  FROM stocks
`;

exports.UPDATE_STOCK = `
  UPDATE stocks
  SET item_id=?, current_stock=?, unit=?, min_threshold=?, updated_at=NOW()
  WHERE stock_id=?
`;
