const Building = require("../../model/Building");
const Lab = require("../../model/Lab");

async function listBuildings(req, res) {
    const buildings = await Building.find({}).sort({ code: 1 });
    return res.status(200).json(buildings);
}

async function getBuildingByCode(req, res) {
    const { code } = req.params;
    const building = await Building.findOne({ code: code.toUpperCase() });

    if (!building) {
        return res.status(404).json({ error: "Building not found." });
    }

    return res.status(200).json(building);
}

async function getBuildingLabs(req, res) {
    const { code } = req.params;
    const buildingCode = code.toUpperCase();
    const building = await Building.findOne({ code: buildingCode });

    if (!building) {
        return res.status(404).json({ error: "Building not found." });
    }

    const labs = await Lab.find({ buildingCode }).sort({ code: 1 });
    return res.status(200).json({
        building,
        labs
    });
}

module.exports = {
    listBuildings,
    getBuildingByCode,
    getBuildingLabs
};
