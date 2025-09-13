const db = require('../db');

// Function to generate next order ID like ORD001, ORD002
async function generateOrderId() {
  const [rows] = await db.execute(`SELECT order_id FROM orders ORDER BY created_date DESC LIMIT 1`);
  if (rows.length === 0) return 'ORD001';

  const lastId = rows[0].order_id; // e.g., ORD005
  const num = parseInt(lastId.replace('ORD', '')) + 1;
  return 'ORD' + num.toString().padStart(3, '0'); // ORD006
}

// Create a new order
exports.createOrder = async (req, res) => {
  let { vendor_name, date, item_count, status, amount } = req.body;

  vendor_name = vendor_name ?? null;
  date = date ?? new Date();
  item_count = item_count ?? 0;
  status = status ?? 'Pending';
  amount = amount ?? 0;

  if (!vendor_name || !item_count || !amount) {
    return res.status(400).json({ success: false, error: 'vendor_name, item_count, and amount are required.' });
  }

  try {
    const order_id = await generateOrderId();

    await db.execute(
      `INSERT INTO orders (order_id, vendor_name, date, item_count, status, amount, created_date)
       VALUES (?, ?, ?, ?, ?, ?, UNIX_TIMESTAMP())`,
      [order_id, vendor_name, date, item_count, status, amount]
    );

    res.status(201).json({ 
      success: true, 
      order_id,
      message: 'Order created successfully' 
    });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Get all orders
exports.getOrders = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT order_id, vendor_name, date, item_count, status, amount FROM orders ORDER BY created_date DESC`
    );
    res.json({ success: true, data: rows });
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
      `SELECT order_id, vendor_name, date, item_count, status, amount FROM orders WHERE order_id=?`,
      [order_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Update an order
exports.updateOrder = async (req, res) => {
  const { order_id } = req.params;
  let { vendor_name, date, item_count, status, amount } = req.body;

  try {
    await db.execute(
      `UPDATE orders 
       SET vendor_name=?, date=?, item_count=?, status=?, amount=?, updated_date=UNIX_TIMESTAMP() 
       WHERE order_id=?`,
      [vendor_name, date, item_count, status, amount, order_id]
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
