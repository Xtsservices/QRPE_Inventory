module.exports = {
  insertOrder: `
    INSERT INTO orders (vendor_name, order_date, status, total, created_at, updated_at)
    VALUES (?, ?, ?, ?, NOW(), NOW())
  `,

  insertOrderItem: `
    INSERT INTO order_items (order_id, item_name, quantity_unit, price, created_at, updated_at)
    VALUES (?, ?, ?, ?, NOW(), NOW())
  `,

  getAllOrders: `
  SELECT 
    o.order_id, 
    o.vendor_name, 
    o.order_date, 
    o.status, 
    CASE 
      WHEN o.status = 'Pending' THEN 0.00
      WHEN o.status = 'Completed' THEN o.total
      ELSE o.total
    END AS total,
    o.created_at, 
    o.updated_at,
    CONCAT(
      '[',
      GROUP_CONCAT(
        JSON_OBJECT(
          'id', oi.id,
          'item_name', oi.item_name,
          'quantity_unit', oi.quantity_unit,
          'price', oi.price
        )
      ),
      ']'
    ) AS items
  FROM orders o
  LEFT JOIN order_items oi ON o.order_id = oi.order_id
  WHERE o.is_deleted = 0
  GROUP BY o.order_id
  ORDER BY o.created_at DESC
`,

getOrderById: `
  SELECT 
    o.order_id, 
    o.vendor_name, 
    o.order_date, 
    o.status, 
    CASE 
      WHEN o.status = 'Pending' THEN 0.00
      WHEN o.status = 'Completed' THEN o.total
      ELSE o.total
    END AS total,
    o.created_at, 
    o.updated_at,
    CONCAT(
      '[',
      GROUP_CONCAT(
        JSON_OBJECT(
          'id', oi.id,
          'item_name', oi.item_name,
          'quantity_unit', oi.quantity_unit,
          'price', oi.price
        )
      ),
      ']'
    ) AS items
  FROM orders o
  LEFT JOIN order_items oi ON o.order_id = oi.order_id
  WHERE o.order_id = ? AND o.is_deleted = 0
  GROUP BY o.order_id
`,

  softDeleteOrder: `
    UPDATE orders 
    SET is_deleted = 1 
    WHERE order_id = ? AND is_deleted = 0
  `,
};
