const Building = require('../../model/Building');

exports.getBuildings = async(req, res) => {
    try{
        const buildings = await Building.find({});
        res.json(buildings);
    }catch(err){
        res.status(500).send('Internal Server Error');
    }
};