// Queries/dashboardQuery.js

exports.itemCount = `
  SELECT COUNT(*) AS item_count FROM items WHERE is_deleted = 0
`;

exports.vendorCount = `
  SELECT COUNT(*) AS vendor_count FROM vendors WHERE is_deleted = 0
`;

exports.alertCount = `
  SELECT COUNT(*) AS alert_count FROM alert WHERE is_deleted = 0
`;

exports.alertNames = `
  SELECT alert_name FROM alert WHERE is_deleted = 0
`;
