const db = require('../db');

// Get dashboard counts and alert names
exports.getDashboardCounts = async (req, res) => {
  try {
    const [[itemCount]] = await db.execute('SELECT COUNT(*) AS item_count FROM item_master');
    const [[vendorCount]] = await db.execute('SELECT COUNT(*) AS vendor_count FROM vendor');
    const [[alertCount]] = await db.execute('SELECT COUNT(*) AS alert_count FROM alert');
    const [alertNames] = await db.execute('SELECT alert_name FROM alert');

    res.json({
      success: true,
      data: {
        item_count: itemCount.item_count,
        vendor_count: vendorCount.vendor_count,
        alert_count: alertCount.alert_count,
        alert_names: alertNames.map(a => a.alert_name)
      }
    });
  } catch (err) {
    console.error('Error fetching dashboard counts:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};