module.exports = {
  createRequest: `
    INSERT INTO inventory_requests 
      (requested_by, total_price, item_count, request_date, created_at, updated_at) 
    VALUES (?, ?, ?, NOW(), NOW(), NOW())
  `,

  createRequestItem: `
    INSERT INTO inventory_request_items 
      (request_id, item_name, quantity, price) 
    VALUES (?, ?, ?, ?)
  `,

  getRequests: `
    SELECT * FROM inventory_requests ORDER BY id DESC
  `,

  getRequestById: `
    SELECT * FROM inventory_requests WHERE id = ?
  `,

  getRequestItems: `
    SELECT * FROM inventory_request_items WHERE request_id = ?
  `,

  updateRequest: `
    UPDATE inventory_requests 
    SET requested_by = ?, total_price = ?, item_count = ?, updated_at = NOW() 
    WHERE id = ?
  `,

  deleteRequestItems: `
    DELETE FROM inventory_request_items WHERE request_id = ?
  `,

  deleteRequest: `
    DELETE FROM inventory_requests WHERE id = ?
  `
};
