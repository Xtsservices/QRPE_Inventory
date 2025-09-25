// Check order exists
exports.checkOrder = `
  SELECT * FROM orders WHERE order_id = ?
`;

// Check vendor exists
exports.checkVendor = `
  SELECT * FROM vendors WHERE vendor_id = ?
`;

// Check item exists
exports.checkItem = `
  SELECT cost FROM item_master WHERE item_id = ?
`;

// Insert billing record
exports.insertBilling = `
  INSERT INTO billing (order_id, vendor_id, item_id, quantity, cost, total, status, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`;

// Get all billing records
exports.getBilling = `
  SELECT 
    o.order_id,
    o.vendor_name,   
    o.order_date,
    o.status AS order_status,
    IFNULL(b.billing_id, 0) AS billing_id,
    im.name AS item_name,   
    COALESCE(b.quantity, oi.quantity_unit) AS quantity,
    COALESCE(b.cost, oi.price) AS cost,
    COALESCE(b.total,
   CAST(REGEXP_SUBSTR(oi.quantity_unit, '^[0-9]+(?:\\.[0-9]+)?') AS DECIMAL(10,2)) * oi.price
    ) AS total,
    IFNULL(b.status, 'Pending') AS billing_status,
    IFNULL(b.notes, '') AS notes
  FROM orders o
  LEFT JOIN billing b ON o.order_id = b.order_id
  LEFT JOIN order_items oi ON o.order_id = oi.order_id
  LEFT JOIN item_master im ON oi.item_name = im.name   
  ORDER BY o.order_date DESC
`;

// Update billing status
exports.updateBillingStatus = `
  UPDATE billing SET status = ? WHERE billing_id = ?
`;
