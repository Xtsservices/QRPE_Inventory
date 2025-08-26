const db = require('../db');

// Create vendor
exports.createVendor = async (req, res) => {
  const { vendor_name, license_number, pan_number, gst_number, point_of_contact, created_by } = req.body;
  // All fields except created_by are mandatory
  if (
    !vendor_name ||
    !license_number ||
    !pan_number ||
    !gst_number ||
    !point_of_contact
  ) {
    return res.status(400).json({
      success: false,
      error: 'vendor_name, license_number, pan_number, gst_number, and point_of_contact are required.'
    });
  }
  try {
    const [result] = await db.execute(
      `INSERT INTO vendor (vendor_name, license_number, pan_number, gst_number, point_of_contact, created_by, created_date)
       VALUES (?, ?, ?, ?, ?, ?, UNIX_TIMESTAMP())`,
      [vendor_name, license_number, pan_number, gst_number, point_of_contact, created_by]
    );
    res.status(201).json({ success: true, vendor_id: result.insertId });
  } catch (err) {
    console.error('Error creating vendor:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Read all vendors
exports.getVendors = async (req, res) => {
  try {
    const [rows] = await db.execute(`SELECT * FROM vendor`);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching vendors:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Update vendor
exports.updateVendor = async (req, res) => {
  const { vendor_id } = req.params;
  let {
    vendor_name,
    license_number,
    pan_number,
    gst_number,
    point_of_contact,
    updated_by
  } = req.body;

  // All fields except updated_by are mandatory for update
  if (
    !vendor_name ||
    !license_number ||
    !pan_number ||
    !gst_number ||
    !point_of_contact
  ) {
    return res.status(400).json({
      success: false,
      error: 'vendor_name, license_number, pan_number, gst_number, and point_of_contact are required.'
    });
  }

  // Convert undefined to null for SQL
  vendor_name = vendor_name ?? null;
  license_number = license_number ?? null;
  pan_number = pan_number ?? null;
  gst_number = gst_number ?? null;
  point_of_contact = point_of_contact ?? null;
  updated_by = updated_by ?? null;

  try {
    await db.execute(
      `UPDATE vendor SET vendor_name=?, license_number=?, pan_number=?, gst_number=?, point_of_contact=?, updated_by=?, updated_date=UNIX_TIMESTAMP() WHERE vendor_id=?`,
      [vendor_name, license_number, pan_number, gst_number, point_of_contact, updated_by, vendor_id]
    );
    res.json({ success: true, message: 'Vendor updated successfully' });
  } catch (err) {
    console.error('Error updating vendor:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Delete vendor
exports.deleteVendor = async (req, res) => {
  const { vendor_id } = req.params;
  try {
    await db.execute(`DELETE FROM vendor WHERE vendor_id=?`, [vendor_id]);
    res.json({ success: true, message: 'Vendor deleted successfully' });
  } catch (err) {
    console.error('Error deleting vendor:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};