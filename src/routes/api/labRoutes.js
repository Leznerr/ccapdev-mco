const express = require("express");
const { param, query } = require("express-validator");

const asyncHandler = require("../../middleware/asyncHandler");
const validateRequest = require("../../middleware/validateRequest");
const labController = require("../../controllers/labController");

const router = express.Router();

router.get(
    "/",
    query("buildingCode").optional().isString().trim().notEmpty(),
    validateRequest,
    asyncHandler(labController.listLabs)
);

router.get(
    "/:code",
    param("code").isString().trim().notEmpty(),
    validateRequest,
    asyncHandler(labController.getLabByCode)
);

router.get(
    "/:code/availability",
    param("code").isString().trim().notEmpty(),
    query("date").isISO8601({ strict: true, strictSeparator: true }),
    query("timeSlot").isString().trim().notEmpty(),
    validateRequest,
    asyncHandler(labController.getLabAvailability)
);

module.exports = router;
