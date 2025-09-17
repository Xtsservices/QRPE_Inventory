const express = require("express");
const router = express.Router();
const billingController = require("../controllers/billingController");

router.post("/billings", billingController.createBilling);
router.get("/billings", billingController.getBilling);
router.patch('/billing/:billing_id/status', billingController.updateBillingStatus);

module.exports = router;
