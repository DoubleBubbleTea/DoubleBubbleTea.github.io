const express = require("express");
const router = express.Router();
const auth = require("../controllers/authController");

router.post("/register", auth.register);
router.post("/login", auth.login);
router.get("/users", auth.getUsers);
router.put("/users/:id", auth.updateUser);
router.delete("/users/:id", auth.deleteUser);

module.exports = router;
