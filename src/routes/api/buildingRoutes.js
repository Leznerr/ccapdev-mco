const express = require("express");
const { param } = require("express-validator");

const asyncHandler = require("../../middleware/asyncHandler");
const validateRequest = require("../../middleware/validateRequest");
const buildingController = require("../../controllers/buildingController");

const router = express.Router();

router.get("/", asyncHandler(buildingController.listBuildings));

router.get(
    "/:code",
    param("code").isString().trim().notEmpty(),
    validateRequest,
    asyncHandler(buildingController.getBuildingByCode)
);

router.get(
    "/:code/labs",
    param("code").isString().trim().notEmpty(),
    validateRequest,
    asyncHandler(buildingController.getBuildingLabs)
);

module.exports = router;
