module.exports = {
  CREATE_STOCK: `
    INSERT INTO stocks 
    (item_id, current_stock, unit, min_threshold, status, created_at) 
    VALUES (?, ?, ?, ?, 'Available', NOW())
  `,

  GET_STOCKS: `
    SELECT 
      s.stock_id,
      s.item_id,
      i.name AS item_name,
      s.current_stock,
      s.unit,
      s.min_threshold,
      s.status,
      s.created_at,
      s.updated_at
    FROM stocks s
    JOIN item_master i ON s.item_id = i.item_id
  `,

  UPDATE_STOCK: `
    UPDATE stocks
    SET item_id=?, current_stock=?, unit=?, min_threshold=?, updated_at=NOW()
    WHERE stock_id=?
  `
};
