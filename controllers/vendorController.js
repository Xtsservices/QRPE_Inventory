const db = require("../db");

// Create Vendor
exports.createVendor = async (req, res) => {
  const {
    vendor_name,
    license_number,
    gst_number,
    pan_number,
    contact_person,
    contact_mobile,
    contact_email,
    mobile_number,
    full_address,
  } = req.body;

  if (
    !vendor_name ||
    !license_number ||
    !gst_number ||
    !pan_number ||
    !contact_person ||
    !contact_mobile ||
    !contact_email ||
    !mobile_number ||
    !full_address
  ) {
    return res.status(400).json({
      success: false,
      error:
        "All fields (vendor_name, license_number, gst_number, pan_number, contact_person, contact_mobile, contact_email, mobile_number, full_address) are required.",
    });
  }

  try {
    const query = `
      INSERT INTO vendors
      (vendor_name, license_number, gst_number, pan_number, contact_person, contact_mobile, contact_email, mobile_number, full_address, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `;
    const values = [
      vendor_name,
      license_number,
      gst_number,
      pan_number,
      contact_person,
      contact_mobile,
      contact_email,
      mobile_number,
      full_address,
    ];
    await db.query(query, values);
    res.json({ success: true, message: "Vendor created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// Get all vendors (only active ones)
exports.getVendors = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM vendors WHERE status = 1");
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// Update vendor
exports.updateVendor = async (req, res) => {
  const { vendor_id } = req.params;
  const {
    vendor_name,
    license_number,
    gst_number,
    pan_number,
    contact_person,
    contact_mobile,
    contact_email,
    mobile_number,
    full_address,
  } = req.body;

  if (!vendor_name || !license_number || !gst_number || !pan_number) {
    return res.status(400).json({
      success: false,
      error:
        "vendor_name, license_number, gst_number, and pan_number are required.",
    });
  }

  try {
    const query = `
      UPDATE vendors
      SET vendor_name = ?, license_number = ?, gst_number = ?, pan_number = ?, contact_person = ?, contact_mobile = ?, contact_email = ?, mobile_number = ?, full_address = ?
      WHERE vendor_id = ? AND status = 1
    `;
    const values = [
      vendor_name,
      license_number,
      gst_number,
      pan_number,
      contact_person,
      contact_mobile,
      contact_email,
      mobile_number,
      full_address,
      vendor_id,
    ];

    const [result] = await db.query(query, values);
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Vendor not found or inactive" });
    }

    res.json({ success: true, message: "Vendor updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// Soft delete vendor
exports.deleteVendor = async (req, res) => {
  const { vendor_id } = req.params;
  try {
    const [result] = await db.query(
      "UPDATE vendors SET status = 0 WHERE vendor_id = ? AND status = 1",
      [vendor_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: "Vendor not found or already inactive",
      });
    }

    res.json({ success: true, message: "Vendor deleted (soft) successfully" });
  } catch (err) {
    console.error("Soft delete vendor error:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};
