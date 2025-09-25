const db = require("../db");
const queries = require("../Queries/vendorQuery");

// Map status → status text
const statusMap = { 1: "Active", 2: "Inactive" };

// ===== CREATE VENDOR =====
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

  // default status = Active
  const status = 1;

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
        "All fields are required: vendor_name, license_number, gst_number, pan_number, contact_person, contact_mobile, contact_email, mobile_number, full_address.",
    });
  }

  try {

    // Check if license_number already exists
    const [existing] = await db.execute(
      "SELECT vendor_id FROM vendors WHERE license_number = ?",
      [license_number]
    );
    if (existing.length > 0) {
      return res.status(409).json({
      success: false,
      error: "A vendor with this license_number already exists.",
      });
    }

    // Check if gst_number already exists
    const [existingGst] = await db.execute(
      "SELECT vendor_id FROM vendors WHERE gst_number = ?",
      [gst_number]
    );
    if (existingGst.length > 0) {
      return res.status(409).json({
      success: false,
      error: "A vendor with this gst_number already exists.",
      });
    }

    // Check if pan_number already exists
    const [existingPan] = await db.execute(
      "SELECT vendor_id FROM vendors WHERE pan_number = ?",
      [pan_number]
    );
    if (existingPan.length > 0) {
      return res.status(409).json({
      success: false,
      error: "A vendor with this pan_number already exists.",
      });
    }

    const [result] = await db.execute(queries.CREATE_VENDOR, [
      vendor_name,
      license_number,
      gst_number,
      pan_number,
      contact_person,
      contact_mobile,
      contact_email,
      mobile_number,
      full_address,
      status,
    ]);

    res.status(201).json({
      success: true,
      data: {
        vendor_id: result.insertId,
        vendor_name,
        license_number,
        gst_number,
        pan_number,
        contact_person,
        contact_mobile,
        contact_email,
        mobile_number,
        full_address,
        status,
        status_text: statusMap[status],
      },
    });
  } catch (err) {
    console.error("Error creating vendor:", err.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// ===== GET ALL VENDORS =====
exports.getVendors = async (req, res) => {
  try {
    const [rows] = await db.execute(queries.GET_ALL_VENDORS);

    const vendors = rows.map((vendor) => ({
      ...vendor,
      status_text: statusMap[vendor.status] || "Unknown",
    }));

    res.json({ success: true, data: vendors });
  } catch (err) {
    console.error("Error fetching vendors:", err.message);
    res.status(500).json({ success: false, error: "Failed to fetch vendors" });
  }
};

// ===== GET VENDOR BY ID =====
exports.getVendorById = async (req, res) => {
  const { vendor_id } = req.params;

  try {
    const [rows] = await db.execute(queries.GET_VENDOR_BY_ID, [vendor_id]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Vendor not found" });
    }

    const vendor = rows[0];
    res.json({
      success: true,
      data: { ...vendor, status_text: statusMap[vendor.status] || "Unknown" },
    });
  } catch (err) {
    console.error("Error fetching vendor by ID:", err.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// ===== UPDATE VENDOR (status cannot be changed) =====
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

  if (!vendor_id) {
    return res
      .status(400)
      .json({ success: false, error: "Vendor ID is required" });
  }

  const updateFields = [];
  const params = [];

  if (vendor_name) {
    updateFields.push("vendor_name=?");
    params.push(vendor_name);
  }
  if (license_number) {
    updateFields.push("license_number=?");
    params.push(license_number);
  }
  if (gst_number) {
    updateFields.push("gst_number=?");
    params.push(gst_number);
  }
  if (pan_number) {
    updateFields.push("pan_number=?");
    params.push(pan_number);
  }
  if (contact_person) {
    updateFields.push("contact_person=?");
    params.push(contact_person);
  }
  if (contact_mobile) {
    updateFields.push("contact_mobile=?");
    params.push(contact_mobile);
  }
  if (contact_email) {
    updateFields.push("contact_email=?");
    params.push(contact_email);
  }
  if (mobile_number) {
    updateFields.push("mobile_number=?");
    params.push(mobile_number);
  }
  if (full_address) {
    updateFields.push("full_address=?");
    params.push(full_address);
  }

  if (!updateFields.length) {
    return res
      .status(400)
      .json({ success: false, error: "No fields to update" });
  }

  params.push(vendor_id);

  try {
    const [result] = await db.execute(
      queries.UPDATE_VENDOR(updateFields),
      params
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Vendor not found" });
    }

    res.json({ success: true, message: "Vendor updated successfully" });
  } catch (err) {
    console.error("Error updating vendor:", err.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// ===== SOFT DELETE VENDOR =====
exports.deleteVendor = async (req, res) => {
  const { vendor_id } = req.params;

  try {
    const [result] = await db.execute(queries.SOFT_DELETE_VENDOR, [vendor_id]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Vendor not found" });
    }

    res.json({ success: true, message: "Vendor marked as inactive" });
  } catch (err) {
    console.error("Error deleting vendor:", err.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};
