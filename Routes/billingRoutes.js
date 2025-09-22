const express = require("express");
const router = express.Router();
const billingController = require("../controllers/billingController");

router.post("/billing", billingController.createBilling);
router.get("/", billingController.getBilling);
router.patch('/billing/:billing_id/status', billingController.updateBillingStatus);

module.exports = router;
