const db = require('../db');

// Function to generate next order ID like ORD001, ORD002
async function generateOrderId() {
  const [rows] = await db.execute(
    `SELECT order_id FROM orders ORDER BY created_date DESC LIMIT 1`
  );
  if (rows.length === 0) return 'ORD001';

  const lastId = rows[0].order_id; // e.g., ORD005
  const num = parseInt(lastId.replace('ORD', '')) + 1;
  return 'ORD' + num.toString().padStart(3, '0'); // ORD006
}

// Create a new order
exports.createOrder = async (req, res) => {
  let { vendorName, date, items, status, totalAmount, notes } = req.body;

  vendorName = vendorName ?? null;
  date = date ?? new Date();
  items = items ?? [];
  status = status ?? 'Pending';
  totalAmount = totalAmount ?? 0;
  notes = notes ?? '';

  if (!vendorName || !items.length) {
    return res.status(400).json({ success: false, error: 'vendorName and items are required.' });
  }

  try {
    const order_id = await generateOrderId();
    const itemCount = items.length;
    const itemsJSON = JSON.stringify(items);

    await db.execute(
      `INSERT INTO orders 
       (order_id, vendor_name, date, item_count, status, amount, notes, items, created_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, UNIX_TIMESTAMP())`,
      [order_id, vendorName, date, itemCount, status, totalAmount, notes, itemsJSON]
    );

    // Return full order object
    const newOrder = {
      id: order_id,
      vendorName,
      date,
      itemCount,
      status,
      totalAmount,
      notes,
      items,
    };

    res.status(201).json({ success: true, order: newOrder });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};


// Get all orders
exports.getOrders = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT order_id, vendor_name, date, item_count, status, amount, notes, items 
       FROM orders ORDER BY created_date DESC`
    );

    // Parse items JSON
    const data = rows.map((row) => ({
      id: row.order_id,
      vendorName: row.vendor_name,
      date: row.date,
      itemCount: row.item_count,
      status: row.status,
      totalAmount: row.amount,
      notes: row.notes,
      items: JSON.parse(row.items),
    }));

    res.json({ success: true, data });
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Get single order by ID
exports.getOrderById = async (req, res) => {
  const { order_id } = req.params;

  try {
    const [rows] = await db.execute(
      `SELECT order_id, vendor_name, date, item_count, status, amount, notes, items 
       FROM orders WHERE order_id=?`,
      [order_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const row = rows[0];
    const order = {
      id: row.order_id,
      vendorName: row.vendor_name,
      date: row.date,
      itemCount: row.item_count,
      status: row.status,
      totalAmount: row.amount,
      notes: row.notes,
      items: JSON.parse(row.items),
    };

    res.json({ success: true, data: order });
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Update an order
exports.updateOrder = async (req, res) => {
  const { order_id } = req.params;
  let { vendorName, date, items, status, totalAmount, notes } = req.body;

  try {
    const itemCount = items.length;
    const itemsJSON = JSON.stringify(items);

    await db.execute(
      `UPDATE orders 
       SET vendor_name=?, date=?, item_count=?, status=?, amount=?, notes=?, items=?, updated_date=UNIX_TIMESTAMP()
       WHERE order_id=?`,
      [vendorName, date, itemCount, status, totalAmount, notes, itemsJSON, order_id]
    );

    res.json({ success: true, message: 'Order updated successfully' });
  } catch (err) {
    console.error('Error updating order:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Delete an order
exports.deleteOrder = async (req, res) => {
  const { order_id } = req.params;
  try {
    await db.execute(`DELETE FROM orders WHERE order_id=?`, [order_id]);
    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (err) {
    console.error('Error deleting order:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
