//import
const express = require("express");
const cors = require("cors");
const axios = require("axios");

require("dotenv").config();

//must use below to install nodemon
//npm install -g nodemon (yarn install nodemon does not work)

// console.log(process.env.MONGO_URI);

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

//get lat and lng based on postal code
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

    /*CRUD below */
    /*{
        "disease": "flu",
        "symptoms": "cough,blocked nose",
    } */
    /*1 create*/
    app.post("/events/create", async (req, res) => {
        console.log(req.body);
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
            let startDateTime = req.body.startDateTime;
            let endDateTime = req.body.endDateTime;

            /*4. main event image */
            let eventImage = req.body.eventImage;
            let customizedMapMarker = req.body.customizedMapMarker;
            let brandColor = req.body.brandColor;

            /*5. description */
            let descriptionSummary = req.body.descriptionSummary;
            let description = req.body.description;

            //get db
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
                description
            })
            res.status(200);
            res.json({
                message: "successly post one event"
            })
        } catch {
            res.status(500);
            res.json({
                message: "failed to post to server"
            })
        }
    })

    /*read*/
    app.get("/events", async (req, res) => {
        //req.query = ?title=recycle day&category=education& => {title: "army", category: "promotion"}
        console.log(req.query);

        // <option>education</option>
        // <option>health & wellness</option>
        // <option>science & tech</option>
        // <option>community & cultural</option>
        // <option>promotion</option>
        // <option>tourism</option>


        try {
            let criteria = {};

            if (req.query.title) {
                criteria["title"] = {
                    "$regex": req.query.title,
                    "$options": "i"
                };
            }
            if (req.query.category) {
                criteria["category"] = {
                    "$regex": req.query.category,
                    "$options": "i"
                };
            }

            /*if need to search for something in an array */
            // if (req.query.symptom) {
            //     criteria["symptom"] = {
            //         "$in": [req.query.symptom]
            //     };
            // }

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

    /*update*/

    // app.put("/events/:id/update", async (req, res) => {

    //     try {
    //         // let {disease, symptom} = req.body;
    //         // console.log(req.body);
    //         let disease = req.body.disease;
    //         // console.log("symptom",req.body.symptom);
    //         let symptom = req.body.symptom.split(",").map(el => el.trim());
    //         // console.log(disease, symptom)
    //         datetime = new Date();

    //         await getDB().collection(COLLECTION_NAME).updateOne({
    //             "_id": ObjectId(req.params.id)
    //         }, {
    //             "$set": {
    //                 disease,
    //                 symptom,
    //                 datetime
    //             }
    //         })

    //         res.status(200);
    //         res.json({
    //             message: `modified one`
    //         })

    //     } catch (error) {
    //         res.status(505);
    //         res.json({
    //             message: "update failed"
    //         })
    //         console.log(error);
    //     }

    // })

    /*delete */
    // app.delete("/events/:id/delete", async (req, res) => {
    //     await getDB().collection(COLLECTION_NAME).deleteOne({
    //         "_id": ObjectId(req.params.id)
    //     })
    //     res.status(200)
    //     res.json({
    //         message: "deleted successfully"
    //     })
    // })
}

main();

//3. listen process.env.PORT
app.listen(3000, () => {
    console.log("server has started")
})