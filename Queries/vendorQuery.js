const CREATE_VENDOR = `
  INSERT INTO vendors 
  (vendor_name, license_number, gst_number, pan_number, contact_person, contact_mobile, contact_email, mobile_number, full_address, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

const GET_ALL_VENDORS = `
  SELECT * FROM vendors
`;

const GET_VENDOR_BY_ID = `
  SELECT * FROM vendors WHERE vendor_id = ?
`;

const UPDATE_VENDOR = (updateFields) => `
  UPDATE vendors SET ${updateFields.join(", ")} WHERE vendor_id = ?
`;

const SOFT_DELETE_VENDOR = `
  UPDATE vendors SET status = 2 WHERE vendor_id = ?
`;

module.exports = {
  CREATE_VENDOR,
  GET_ALL_VENDORS,
  GET_VENDOR_BY_ID,
  UPDATE_VENDOR,
  SOFT_DELETE_VENDOR,
};
