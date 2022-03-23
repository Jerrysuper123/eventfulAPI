//import
const express = require("express");
const cors = require("cors");

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

async function main() {
    //general name to be accessed later
    const COLLECTION_NAME = "events";

    //connect to database, oncetime connection, later can use getDB directly to access the database
    await connect(process.env.MONGO_URI, "eventfulDB");

    app.get("/welcome", (req, res) => {
        res.json({
            message: "welcome to eventful API"
        })
    })

    /*CRUD below */
    /*{
        "disease": "flu",
        "symptoms": "cough,blocked nose",
    } */
    /*1 create*/
    app.post("/events", async (req, res) => {
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

            //retrieve lat and lng using OneMap API
            let latLng = [];

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
    // app.get("/events", async (req, res) => {
    //     //req.query = ?disease="dengue"&symptoms="cough" = {disease: "dengue", symptoms: "cough"}
    //     // console.log(req.query);

    //     let criteria = {};


    //     if (req.query.disease) {
    //         criteria["disease"] = {
    //             "$regex": req.query.disease,
    //             "$options": "i"
    //         };
    //     }

    //     if (req.query.symptom) {
    //         criteria["symptom"] = {
    //             "$in": [req.query.symptom]
    //         };
    //     }
    //     // read from right to left, flu is in disease, cough is in array symptom
    //     // {
    //     //     disease: { '$regex': 'flu', options: 'i' },
    //     //     symptom: { '$in': [ 'cough' ] }
    //     //   }

    //     // console.log(criteria);

    //     const db = getDB();
    //     let diseaseSymptoms = await db.collection(COLLECTION_NAME).find(criteria).toArray();
    //     res.json({
    //         data: diseaseSymptoms
    //     })
    // })

    /*update*/

    // app.put("/events/:id", async (req, res) => {

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
    // app.delete("/events/:id", async (req, res) => {
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