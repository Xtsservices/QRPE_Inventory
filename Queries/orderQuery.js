module.exports = {
  // Insert order
  insertOrder: `
    INSERT INTO orders (vendor_name, date, status, total, is_deleted)
    VALUES (?, ?, ?, ?, 0)
  `,

  // Insert order item
  insertOrderItem: `
    INSERT INTO order_items (order_id, item_name, unit, quantity, price)
    VALUES (?, ?, ?, ?, ?)
  `,

  // Delete items for update
  deleteOrderItems: `
    DELETE FROM order_items WHERE order_id = ?
  `,

  // Get all orders with items as JSON string (fallback for old MySQL)
  getAllOrders: `
    SELECT 
      o.order_id,
      o.vendor_name,
      o.date,
      o.status,
      o.total,
      CONCAT('[', 
        IFNULL(
          GROUP_CONCAT(
            CONCAT(
              '{"item":"', REPLACE(IFNULL(oi.item_name,''), '"','\\"'), '"',
              ',"quantity":', IFNULL(oi.quantity,0),
              ',"unit":"', IFNULL(oi.unit,''), '"',
              ',"price":', IFNULL(oi.price,0),
              '}'
            )
            SEPARATOR ','
          ), 
          ''
        ),
      ']') AS items
    FROM orders o
    LEFT JOIN order_items oi ON o.order_id = oi.order_id
    WHERE o.is_deleted = 0
    GROUP BY o.order_id
    ORDER BY o.date DESC
  `,

  // Get single order by ID
  getOrderById: `
    SELECT 
      o.order_id,
      o.vendor_name,
      o.date,
      o.status,
      o.total,
      CONCAT('[', 
        IFNULL(
          GROUP_CONCAT(
            CONCAT(
              '{"item":"', REPLACE(IFNULL(oi.item_name,''), '"','\\"'), '"',
              ',"quantity":', IFNULL(oi.quantity,0),
              ',"unit":"', IFNULL(oi.unit,''), '"',
              ',"price":', IFNULL(oi.price,0),
              '}'
            )
            SEPARATOR ','
          ), 
          ''
        ),
      ']') AS items
    FROM orders o
    LEFT JOIN order_items oi ON o.order_id = oi.order_id
    WHERE o.order_id = ? AND o.is_deleted = 0
    GROUP BY o.order_id
  `,

  // Soft delete
  softDeleteOrder: `
    UPDATE orders SET is_deleted = 1 WHERE order_id = ?
  `,
};
