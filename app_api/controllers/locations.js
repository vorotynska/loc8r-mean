const mongoose = require("mongoose");
const Loc = require('../models/location');

const locationsCreate = async (req, res, next) => {
    try {
        // Checking and converting coordinates
        const lng = parseFloat(req.body.lng);
        const lat = parseFloat(req.body.lat);
        if (isNaN(lng) || isNaN(lat)) {
            return res.status(400).json({
                "error": "Invalid coordinates"
            });
        }

        const location = await Loc.create({
            name: req.body.name,
            address: req.body.address,
            facilities: req.body.facilities.split(",").map(facility => facility.trim()),
            coords: {
                type: "Point",
                coordinates: [lng, lat]
            },
            openingTimes: {
                days: req.body.days2,
                opening: req.body.opening2,
                closing: req.body.closing2,
                closed: req.body.closed2,
            }
        });
        res.status(201).json(location);
        next();
    } catch (err) {
        // Detailed error handling
        const errorDetails = {};
        for (const field in err.errors) {
            errorDetails[field] = err.errors[field].message;
        }
        return res.status(500).json({
            "error": errorDetails
        });
    }
};

const locationsListByDistance = (req, res, next) => {
    const locationsListByDistance = async (req, res) => {
        const lng = parseFloat(req.query.lng);
        const lat = parseFloat(req.query.lat);
        const near = {
            type: "Point",
            coordinates: [lng, lat]
        };
        const geoOptions = {
            distanceField: "distance.calculated",
            key: 'coords',
            spherical: true,
            maxDistance: 20000,
            limit: 10
        };
        if (!lng || !lat) {
            return res
                .status(404)
                .json({
                    "message": "lng and lat query parameters are required"
                });
        }
        try {
            const results = await Loc.aggregate([{
                $geoNear: {
                    near,
                    ...geoOptions
                }
            }]);
            const locations = results.map(result => {
                return {
                    id: result._id,
                    name: result.name,
                    address: result.address,
                    rating: result.rating,
                    facilities: result.facilities,
                    distance: `${result.distance.calculated.toFixed()}m`
                }
            });
            res
                .status(200)
                .json(locations);
        } catch (err) {
            res
                .status(404)
                .json(err);
        }
    };
};

const locationsReadOne = async (req, res) => {
    try {
        const location = await Loc.findById(req.params.locationid).exec();
        if (!location) {
            return res.status(404).json({
                "message": "Location not found"
            });
        }
        res.status(200).json(location);
    } catch (err) {
        return res.status(500).json({
            "error": err.message
        });
    }
};

const locationsUpdateOne = async (req, res, next) => {
    try {
        if (!req.params.locationid) {
            return res
                .status(404)
                .json({
                    "message": "Not found, locationid is required"
                });
        }
        const location = await Loc
            .findById(req.params.locationid)
            .select('-reviews -rating')
            .exec();
        if (!location) {
            return res
                .json(404)
                .status({
                    "message": "locationid not found"
                });
        } else {
            location.name = req.body.name;
            location.address = req.body.address;
            location.facilities = req.body.facilities.split(',').map(facility => facility.trim());
            location.coords = {
                type: "Point",
                coordinates: [
                    parseFloat(req.body.lng),
                    parseFloat(req.body.lat)
                ]
            };
            location.openingTimes = [{
                days: req.body.days1,
                opening: req.body.opening1,
                closing: req.body.closing1,
                closed: req.body.closed1,
            }, {
                days: req.body.days2,
                opening: req.body.opening2,
                closing: req.body.closing2,
                closed: req.body.closed2,
            }];
            await location.save();
        };
        res
            .status(200)
            .json(location);
    } catch (err) {
        return res.status(500).json({
            "error": err.message
        });
    }
};

const locationsDeleteOne = async (req, res, next) => {
    try {
        const {
            locationid
        } = req.params;
        if (locationid) {
            const location = await Loc
                .findByIdAndDelete(locationid)
                .exec();
            res
                .status(204)
                .json(null);
        } else {
            res
                .status(404)
                .json({
                    "message": "No Location"
                });
        }
    } catch (err) {
        return res.status(500).json({
            "error": err.message
        })
    }
};

module.exports = {
    locationsListByDistance,
    locationsCreate,
    locationsReadOne,
    locationsUpdateOne,
    locationsDeleteOne
};