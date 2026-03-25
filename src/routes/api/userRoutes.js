const express = require("express");
const { body, param, query } = require("express-validator");

const asyncHandler = require("../../middleware/asyncHandler");
const validateRequest = require("../../middleware/validateRequest");
const userController = require("../../controllers/userController");

const router = express.Router();

router.get(
    "/",
    query("role").optional().isIn(["Student", "Lab Technician"]),
    validateRequest,
    asyncHandler(userController.listUsers)
);

router.get(
    "/:username",
    param("username").isString().trim().notEmpty(),
    validateRequest,
    asyncHandler(userController.getUserByUsername)
);

router.post(
    "/",
    body("username").isString().trim().notEmpty(),
    body("role").isIn(["Student", "Lab Technician"]),
    body("firstName").isString().trim().notEmpty(),
    body("lastName").isString().trim().notEmpty(),
    body("email").isEmail(),
    body("password").isString().isLength({ min: 6 }),
    body("bio").optional().isString(),
    body("profilePic").optional().isString(),
    validateRequest,
    asyncHandler(userController.createUser)
);

router.put(
    "/:username",
    param("username").isString().trim().notEmpty(),
    body("role").optional().isIn(["Student", "Lab Technician"]),
    body("firstName").optional().isString().trim().notEmpty(),
    body("lastName").optional().isString().trim().notEmpty(),
    body("email").optional().isEmail(),
    body("password").optional().isString().isLength({ min: 6 }),
    body("bio").optional().isString(),
    body("profilePic").optional().isString(),
    validateRequest,
    asyncHandler(userController.updateUser)
);

router.delete(
    "/:username",
    param("username").isString().trim().notEmpty(),
    validateRequest,
    asyncHandler(userController.deleteUser)
);

module.exports = router;
