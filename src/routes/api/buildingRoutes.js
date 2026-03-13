const express = require("express");
const router = express.Router();
const buildingController = require('../controllers/buildingController');

router.get('/buildings', buildingController.getBuildings);

module.exports = router;