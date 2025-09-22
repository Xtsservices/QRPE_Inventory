const db = require('../db');
const queries = require('../Queries/dashboardQuery');

// Get dashboard counts and alert names
exports.getDashboardCounts = async (req, res) => {
  try {
    const [[itemCount]] = await db.execute(queries.itemCount);
    const [[vendorCount]] = await db.execute(queries.vendorCount);
    const [[alertCount]] = await db.execute(queries.alertCount);
    const [alertNames] = await db.execute(queries.alertNames);

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
