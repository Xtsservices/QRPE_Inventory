// routes/inventoryrequestRoutes.js
const express = require("express");
const router = express.Router();

const inventoryrequestController = require("../controllers/inventoryrequestController");

router.post("/", inventoryrequestController.createRequest);
router.get("/", inventoryrequestController.getRequests);
router.get("/:id", inventoryrequestController.getRequestById);
router.put("/:id", inventoryrequestController.updateRequest);
//router.delete("/:id", inventoryrequestController.deleteRequest);

module.exports = router;
 