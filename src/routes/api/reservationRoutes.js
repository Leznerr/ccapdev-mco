const express = require("express");
const { body, param, query } = require("express-validator");

const asyncHandler = require("../../middleware/asyncHandler");
const validateRequest = require("../../middleware/validateRequest");
const reservationController = require("../../controllers/reservationController");

const router = express.Router();

const reservationIdParamValidator = param("reservationId").isInt({ min: 1 });
const groupIdParamValidator = param("groupId").isInt({ min: 1 });

const createReservationValidators = [
    body("labCode").isString().trim().notEmpty(),
    body("seat").isString().trim().notEmpty(),
    body("date").isISO8601({ strict: true, strictSeparator: true }),
    body("reserverUsername").isString().trim().notEmpty(),
    body("status").optional().isIn(["Active", "Cancelled", "Completed"]),
    body("isAnonymous").optional().isBoolean(),
    body("reservationGroupId").optional().isInt({ min: 1 }),
    body().custom((payload) => {
        const hasSlots = Array.isArray(payload.slots) && payload.slots.length > 0;
        const hasTimeSlot = typeof payload.timeSlot === "string" && payload.timeSlot.trim().length > 0;
        if (!hasSlots && !hasTimeSlot) {
            throw new Error("Provide at least one time slot via slots[] or timeSlot.");
        }
        return true;
    })
];

const updateReservationValidators = [
    reservationIdParamValidator,
    body("labCode").optional().isString().trim().notEmpty(),
    body("seat").optional().isString().trim().notEmpty(),
    body("date").optional().isISO8601({ strict: true, strictSeparator: true }),
    body("timeSlot").optional().isString().trim().notEmpty(),
    body("status").optional().isIn(["Active", "Cancelled", "Completed"]),
    body("isAnonymous").optional().isBoolean(),
    body("reserverUsername").optional().isString().trim().notEmpty(),
    body("reservedForUsername").optional().isString(),
    body("profileUsername").optional().isString()
];

const replaceGroupValidators = [
    groupIdParamValidator,
    body("labCode").optional().isString().trim().notEmpty(),
    body("seat").optional().isString().trim().notEmpty(),
    body("date").optional().isISO8601({ strict: true, strictSeparator: true }),
    body("status").optional().isIn(["Active", "Cancelled", "Completed"]),
    body("isAnonymous").optional().isBoolean(),
    body("reserverUsername").optional().isString().trim().notEmpty(),
    body("reservedForUsername").optional().isString(),
    body("profileUsername").optional().isString()
];

router.get(
    "/",
    query("labCode").optional().isString().trim().notEmpty(),
    query("seat").optional().isString().trim().notEmpty(),
    query("date").optional().isISO8601({ strict: true, strictSeparator: true }),
    query("timeSlot").optional().isString().trim().notEmpty(),
    query("status").optional().isIn(["Active", "Cancelled", "Completed"]),
    query("reserverUsername").optional().isString().trim().notEmpty(),
    query("reservedForUsername").optional().isString(),
    query("profileUsername").optional().isString(),
    query("reservationGroupId").optional().isInt({ min: 1 }),
    validateRequest,
    asyncHandler(reservationController.listReservations)
);

router.get(
    "/group/:groupId",
    groupIdParamValidator,
    validateRequest,
    asyncHandler(reservationController.getReservationGroup)
);

router.get(
    "/:reservationId",
    reservationIdParamValidator,
    validateRequest,
    asyncHandler(reservationController.getReservationById)
);

router.post(
    "/",
    createReservationValidators,
    validateRequest,
    asyncHandler(reservationController.createReservations)
);

router.put(
    "/group/:groupId",
    replaceGroupValidators,
    validateRequest,
    asyncHandler(reservationController.replaceReservationGroup)
);

router.delete(
    "/group/:groupId",
    groupIdParamValidator,
    validateRequest,
    asyncHandler(reservationController.deleteReservationGroup)
);

router.put(
    "/:reservationId",
    updateReservationValidators,
    validateRequest,
    asyncHandler(reservationController.updateReservationById)
);

router.delete(
    "/:reservationId",
    reservationIdParamValidator,
    validateRequest,
    asyncHandler(reservationController.deleteReservationById)
);

module.exports = router;
