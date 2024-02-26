const mongoose = require("mongoose");
const Loc = require('../models/location');

const reviewsCreate = async (req, res) => {
    const locationId = req.params.locationid;
    try {
        if (locationId) {
            const location = await Loc
                .findById(locationId)
                .select('reviews')
                .exec()
            if (!location) {
                res
                    .status(400)
                    .json({
                        "message": "Location not found"
                    });
            } else {
                // Ok! Add review
                doAddReview(req, res, location);
            }
        } else {
            res
                .status(404)
                .json({
                    "message": "Location not found"
                });
        }
    } catch (error) {
        return res.status(500).json({
            "error": err.message
        })
    }
};

const doAddReview = (req, res, location) => {
    if (!location) {
        res
            .status(404)
            .json({
                "message": "Location not found"
            });
    } else {
        const {
            author,
            rating,
            reviewText
        } = req.body;
        // Adding a new review to the list of reviews
        location.reviews.push({
            author,
            rating,
            reviewText
        });
        // Save location with new review
        location.save((err, location) => {
            if (err) {
                res
                    .status(400)
                    .json(err);
            } else {
                //Update the average location rating
                updateAverageRating(location._id);
                //We get the last added review and return it
                const thisReview = location.reviews.slice(-1).pop();
                res
                    .status(201)
                    .json(thisReview);
            }
        });
    }
};

const doSetAverageRating = (location) => {
    //  Checking if the location has reviews
    if (location.reviews && location.reviews.length > 0) {
        //We calculate the overall rating and number of reviews
        const count = location.reviews.length;
        const total = location.reviews.reduce((acc, {
            rating
        }) => {
            return acc + rating;
        }, 0);
        //Calculate the average rating and update it for the location
        location.rating = parseInt(total / count, 10);
        location.save(err => {
            if (err) {
                console.log(err);
            } else {
                console.log(`Average rating updated to ${location.rating}`);
            }
        });
    }
};
const updateAverageRating = (locationId) => {
    Loc.findById(locationId)
        .select('rating reviews')
        .exec((err, location) => {
            if (!err) {
                //If there are no errors, call the function to set the average rating
                doSetAverageRating(location);
            }
        });
};

const reviewsReadOne = async (req, res) => {
    try {
        const location = await Loc
            .findById(req.params.locationid)
            .select('name reviews')
            .exec();
        if (!location) {
            return res
                .status(404)
                .json({
                    "message": "location not found"
                });
        }
        if (location.reviews && location.reviews.length > 0) {
            const review = location.reviews.id(req.params.reviewid);
            if (!review) {
                return res
                    .status(400)
                    .json({
                        "message": "review not found"
                    });
            } else {
                let response = {
                    location: {
                        name: location.name,
                        id: req.params.locationid
                    },
                    review
                };
                return res
                    .status(200)
                    .json(response);
            }
        } else {
            return res
                .status(404)
                .json({
                    "message": "No reviews found"
                });
        }
    } catch (err) {
        return res.status(500).json({
            "error": err.message
        })
    }
};

const reviewsUpdateOne = async (req, res) => {
    try {
        if (!req.params.locationid || !req.params.reviewid) {
            return res
                .status(404)
                .json({
                    "message": "Not found, locationid and reviewid are both required"
                });
        }
        const location = await Loc
            .findById(req.params.locationid)
            .select('reviews')
            .exec()
        if (!location) {
            return res
                .status(404)
                .json({
                    "message": "Location not found"
                });
        };
        if (location.reviews && location.reviews.length > 0) {
            const thisReview = location.reviews.id(req.params.reviewid);
            if (!thisReview) {
                return res
                    .status(404)
                    .json({
                        "message": "Review not found"
                    });
            } else {
                thisReview.author = req.body.author;
                thisReview.rating = req.body.rating;
                thisReview.reviewText = req.body.reviewText;
                await location.save();
                updateAverageRating(location._id);
                return res
                    .status(200)
                    .json(thisReview);
            }
        } else {
            return res
                .status(404)
                .json({
                    "message": "No review to update"
                });
        }
    } catch (err) {
        return res.status(500).json({
            "erroe": err.message
        })
    }
}

const reviewsDeleteOne = (req, res) => {
    const {
        locationid,
        reviewid
    } = req.params;
    if (!locationid || !reviewid) {
        return res
            .status(404)
            .json({
                'message': 'Not found, locationid and reviewid are both required'
            });
    }
    Loc
        .findById(locationid)
        .select('reviews')
        .exec((err, location) => {
            if (!location) {
                return res
                    .status(404)
                    .json({
                        'message': 'Location not found'
                    });
            } else if (err) {
                return res
                    .status(400)
                    .json(err);
            }

            if (location.reviews && location.reviews.length > 0) {
                if (!location.reviews.id(reviewid)) {
                    return res
                        .status(404)
                        .json({
                            'message': 'Review not found'
                        });
                } else {
                    location.reviews.id(reviewid).remove();
                    location.save(err => {
                        if (err) {
                            return res
                                .status(404)
                                .json(err);
                        } else {
                            updateAverageRating(location._id);
                            res
                                .status(204)
                                .json(null);
                        }
                    });
                }
            } else {
                res
                    .status(404)
                    .json({
                        'message': 'No Review to delete'
                    });
            }
        });
};

module.exports = {
    reviewsCreate,
    reviewsReadOne,
    reviewsUpdateOne,
    reviewsDeleteOne
};