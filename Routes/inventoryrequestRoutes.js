// routes/inventoryrequestRoutes.js
const express = require("express");
const router = express.Router();

const inventoryrequestController = require("../controllers/inventoryrequestController");

// Create a new inventory request
router.post("/", inventoryrequestController.createRequest);
// Get all inventory requests
router.get("/", inventoryrequestController.getRequests);
// Get a single request by ID
router.get("/:id", inventoryrequestController.getRequestById);
// Update an existing request
router.put("/:id", inventoryrequestController.updateRequest);
// Delete a request
router.delete("/:id", inventoryrequestController.deleteRequest);

module.exports = router;
