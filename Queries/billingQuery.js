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
  o.date AS order_date,
  o.status AS order_status,
  b.billing_id,
  oi.item_name,
  COALESCE(b.quantity, oi.quantity) AS quantity,
  COALESCE(b.cost, oi.price) AS cost,
  COALESCE(b.total, oi.total) AS total, -- make sure this column exists and is correctly populated
  IFNULL(b.status, 'Pending') AS status,
  IFNULL(b.notes, '') AS notes
FROM orders o
LEFT JOIN billing b ON o.order_id = b.order_id
LEFT JOIN order_items oi ON o.order_id = oi.order_id
ORDER BY o.date DESC;

    `;

// Update billing status
exports.updateBillingStatus = `
  UPDATE billing SET status = ? WHERE billing_id = ?
`;
