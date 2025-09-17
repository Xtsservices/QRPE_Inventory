const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

router.get("/", userController.getAllUsers);
router.post("/register", userController.registerUser);
router.get("/:user_id", userController.getUserById); 
router.delete("/:user_id", userController.deleteUser);
router.put('/:user_id', userController.updateUser);




module.exports = router;
