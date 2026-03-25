const express = require("express");
const { body } = require("express-validator");

const asyncHandler = require("../../middleware/asyncHandler");
const validateRequest = require("../../middleware/validateRequest");
const authController = require("../../controllers/authController");

const router = express.Router();

router.post(
    "/login",
    body("email").isEmail(),
    body("password").isString().notEmpty(),
    validateRequest,
    asyncHandler(authController.login)
);

module.exports = router;
