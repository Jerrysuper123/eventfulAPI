
const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

//1. set up
const app = express();
//allow user to submit json format
app.use(express.json())
//allow cross sharing of api
app.use(cors());

const { connect, getDB } = require("./MongoUtil");
//convert number to special obj it in mongo
const ObjectId = require("mongodb").ObjectId;

//2. route
app.get("/", (req, res) => {
    res.send("You have connected to eventful API. Welcome!")
})

//validation functions
const validationEvent = (
    title,
    organizer,
    category,

    address,
    postalCode,
    latLng,
    startDateTime,
    endDateTime,

    descriptionSummary,
    description,
    eventImage = "",

    //optional
    customizedMapMarker = "",
    brandColor = "",
    hashtags = [],
) => {
    let hasError = false;

    if (title === "" || title.split(" ").length > 10) {
        hasError = true;
        console.log("title");
    }

    if (organizer === "") {
        hasError = true;
        console.log("organizer");
    }

    if (category === "") {
        hasError = true;
        console.log("cat");
    }

    if (!Array.isArray(hashtags)) {
        hasError = true;
        console.log("hastags");
    }

    if (address === "") {
        hasError = true;
        console.log("add");
    }

    if (postalCode.length !== 6) {
        hasError = true;
        console.log("postal");
    }


    if (!Array.isArray(latLng) || latLng.length != 2) {
        hasError = true;
        console.log("latLng");
    }

    if (eventImage === "") {
        hasError = true;
        console.log("eventImage");
    }

    if (startDateTime === "") {
        hasError = true;
        console.log("startTime");
    }

    if (endDateTime === "") {
        hasError = true;
        console.log("endTime");
    }

    if (!compareStartEndDate(startDateTime, endDateTime)) {
        hasError = true;
        console.log("compare start end time");
    }

    if (descriptionSummary === "") {

        hasError = true;
        console.log("summary");
    }

    if (description === "") {
        hasError = true;
        console.log("description");
    }
    return hasError;
};

const compareStartEndDate = (startDateTime, endDateTime) => {
    if (startDateTime < endDateTime) {
        return true;
    } else {
        return false;
    }
};

const validateReviews = (name, rating, feedback, date) => {
    let hasError = false;
    if (name === "") {
        hasError = true;
    }
    if (rating < 0 || rating > 5) {
        hasError = true;
    }
    if (feedback === "") {
        hasError = true;
    }

    if (date === "") {
        hasError = true;
    }
    return hasError;
};



//get lat and lng based on postal code; not using this on the API
const getLatLng = async (postalCode) => {
    try {
        let response = await axios.get(`https://developers.onemap.sg/commonapi/search?searchVal=${postalCode}&returnGeom=Y&getAddrDetails=Y&pageNum=1`);
        if (response.found === 0) {
            return `Postal code lat and lng not found; try change postal code again`
        } else if (response.results[0]) {
            let lat = Number(response.results[0].LATITUDE);
            let lng = Number(response.results[0].LONGITUDE);
            console.log([lat, lng]);
            return [lat, lng]
        }
    } catch (e) {
        console.log(e);
        return `oneMap API failed to retrieve the postal code's lat and lng`
    }
}

async function main() {
    //general name to be accessed later
    const COLLECTION_NAME = "events";

    //connect to database, oncetime connection, later can use getDB directly to access the database
    await connect(process.env.MONGO_URI, "eventfulDB");

    /*create event*/
    app.post("/events/create", async (req, res) => {
        try {
            /*1. basic info */
            let title = req.body.title;
            let organizer = req.body.organizer;
            let category = req.body.category;
            let hashtags = req.body.hashtags;

            /*2. location */
            let address = req.body.address;
            let postalCode = req.body.postalCode;

            //retrieve lat and lng using OneMap API, maybe we should do it on browser side
            //but we need to validate lat and lng on browser side
            let latLng = req.body.latLng;

            /*3. date and time */
            let startDateTime = new Date(req.body.startDateTime);
            let endDateTime = new Date(req.body.endDateTime);

            /*4. main event image */
            let eventImage = req.body.eventImage;
            let customizedMapMarker = req.body.customizedMapMarker;
            let brandColor = req.body.brandColor;

            /*5. description */
            let descriptionSummary = req.body.descriptionSummary;
            let description = req.body.description;

            // default is false - hasError, so inverse it
            if (!validationEvent(
                title,
                organizer,
                category,
                address,
                postalCode,
                latLng,
                startDateTime,
                endDateTime,
                descriptionSummary,
                description,
                eventImage,
            )) {
                const db = getDB();
                await db.collection(COLLECTION_NAME).insertOne({
                    title,
                    organizer,
                    category,
                    hashtags,
                    address,
                    postalCode,
                    latLng,
                    startDateTime,
                    endDateTime,
                    eventImage,
                    customizedMapMarker,
                    brandColor,
                    descriptionSummary,
                    description,
                })
                res.status(200);
                res.json({
                    message: "successly post one event"
                })
            } else {
                return;
            }

        } catch {
            res.status(500);
            res.json({
                message: "failed to post to server"
            })
        }
    })

    /*read hashtags*/
    app.get("/events/hashtags", async (req, res) => {

        try {
            const db = getDB();
            let hashtags = await db.collection("hashtags").find().toArray();
            res.status(200);
            res.json({
                data: hashtags
            })
        } catch (e) {
            res.status(500);
            res.json({
                message: "failed to retrieve hashtags from eventful API"
            })
        }
    })

    /*read categories*/
    app.get("/events/categories", async (req, res) => {
        try {
            const db = getDB();
            let categories = await db.collection("categories").find().toArray();
            res.status(200);
            res.json({
                data: categories
            })
        } catch (e) {
            res.status(500);
            res.json({
                message: "failed to retrieve categories from eventful API"
            })
        }
    })

    /*read event*/
    app.get("/events", async (req, res) => {
        //req.query = ?title=recycle day&category=education&startDateTime=2022-03-20&organizer=H&M 
        //=> {title: "army", category: "education",startDateTime=2022-03-20&organizer: "H&M" }
        //each time load the whole month data into the app

        try {
            /*retrieve events for all dates for now, even though we only loads in for the month data*/
            /*the datasize is small */
            let criteria = {};

            /*An array to match an array query, return if true */
            if (req.query.searchCategories) {
                criteria["category"] = {
                    $in: req.query.searchCategories
                };
            }

            /*An array to match an array query, return if true */
            if (req.query.searchTags) {
                criteria["hashtags"] = {
                    $in: req.query.searchTags
                };
            }

            if (req.query.category) {
                criteria["category"] = {
                    "$regex": req.query.category,
                    "$options": "i"
                };
            }

            /*if need to search for something in an array */
            if (req.query.hashtags) {
                criteria["hashtags"] = {
                    "$in": [req.query.hashtags]
                };
            }

            /*implement but will not use it in front-end for now  */
            if (req.query.startDateTime) {
                criteria["startDateTime"] = {
                    "$gte": new Date(req.query.startDateTime),
                };
            }

            /*general search will look through title, organizer, descriptionSummmary, description */
            if (req.query.search) {
                criteria["$or"] = [
                    {
                        title: {
                            "$regex": req.query.search,
                            "$options": "i"
                        }
                    },
                    {
                        organizer: {
                            "$regex": req.query.search,
                            "$options": "i"
                        }
                    },
                    {
                        descriptionSummary: {
                            "$regex": req.query.search,
                            "$options": "i"
                        }
                    },
                    {
                        description: {
                            "$regex": req.query.search,
                            "$options": "i"
                        }
                    }
                ]
            }

            /*specific search for title and organizer */
            if (req.query.title) {
                criteria["title"] = {
                    "$regex": req.query.title,
                    "$options": "i"
                };
            }

            if (req.query.organizer) {
                criteria["organizer"] = {
                    "$regex": req.query.organizer,
                    "$options": "i"
                };
            }

            const db = getDB();
            let events = await db.collection(COLLECTION_NAME).find(criteria).toArray();
            res.status(200);
            res.json({
                data: events
            })
        } catch (e) {
            res.status(500);
            res.json({
                message: "failed to retrieve events from eventful API"
            })
        }
    })



    /*update event*/
    app.put("/events/:id/update", async (req, res) => {

        try {
            // console.log(req.body);
            /*1. basic info */
            let title = req.body.title;
            let organizer = req.body.organizer;
            let category = req.body.category;
            let hashtags = req.body.hashtags;

            /*2. location */
            let address = req.body.address;
            let postalCode = req.body.postalCode;

            //retrieve lat and lng using OneMap API, maybe we should do it on browser side
            //but we need to validate lat and lng on browser side
            let latLng = req.body.latLng;

            /*3. date and time */
            let startDateTime = new Date(req.body.startDateTime);
            let endDateTime = new Date(req.body.endDateTime);

            /*4. main event image */
            let eventImage = req.body.eventImage;
            let customizedMapMarker = req.body.customizedMapMarker;
            let brandColor = req.body.brandColor;

            /*5. description */
            let descriptionSummary = req.body.descriptionSummary;
            let description = req.body.description;

            if(!validationEvent(
                title,
                organizer,
                category,
                address,
                postalCode,
                latLng,
                startDateTime,
                endDateTime,
                descriptionSummary,
                description,
                eventImage,
            )){
                await getDB().collection(COLLECTION_NAME).updateOne({
                    "_id": ObjectId(req.params.id)
                }, {
                    "$set": {
                        title,
                        organizer,
                        category,
                        hashtags,
                        address,
                        postalCode,
                        latLng,
                        startDateTime,
                        endDateTime,
                        eventImage,
                        customizedMapMarker,
                        brandColor,
                        descriptionSummary,
                        description
                    }
                })
    
                res.status(200);
                res.json({
                    message: `modified one event`
                })

            } else {
                return;
            }

           

        } catch (error) {
            res.status(505);
            res.json({
                message: "update failed"
            })
            console.log(error);
        }
    })

    /*create reviews for event*/
    app.put("/events/:id/reviews/create", async (req, res) => {

        try {
            // console.log(req.body);
            /*1. basic info */
            let name = req.body.name;
            let rating = Number(req.body.rating);
            let feedback = req.body.feedback;
            let date = req.body.date;

            // noerror is false, so must inverse it
            if (!validateReviews(name, rating, feedback, date)) {
                await getDB().collection(COLLECTION_NAME).updateOne({
                    "_id": ObjectId(req.params.id)
                }, {
                    '$push': {
                        'reviews': {
                            '_id': ObjectId(),
                            'name': name,
                            'rating': rating,
                            'feedback': feedback,
                            'date': date
                        }
                    }
                }
                )
    
                res.status(200);
                res.json({
                    message: `modified one event`
                })
            } else {
                return;
            }
        } catch (error) {
            res.status(505);
            res.json({
                message: "update failed"
            })
            console.log(error);
        }
    })

    /*delete */
    app.delete("/events/:id/delete", async (req, res) => {
        try {
            await getDB().collection(COLLECTION_NAME).deleteOne({
                "_id": ObjectId(req.params.id)
            })
            res.status(200)
            res.json({
                message: "deleted one event successfully"
            })

        } catch (e) {
            res.status(505);
            res.json({
                message: "delete failed"
            })
            console.log(error);
        }
    })
}

main();

//3. listen process.env.PORT
app.listen(process.env.PORT, () => {
    console.log("server has started")
})