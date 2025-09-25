// Queries/dashboardQuery.js

exports.itemCount = `
  SELECT COUNT(*) AS item_count FROM item_master WHERE is_deleted = 0
`;

exports.vendorCount = `
  SELECT COUNT(*) AS vendor_count FROM vendors
`;

exports.alertCount = `
  SELECT COUNT(*) AS alert_count FROM alert 
`;

exports.alertNames = `
  SELECT alert_name FROM alert 
`;
