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
    res.send("hello world")
})

async function main() {
    //general name to be accessed later
    const COLLECTION_NAME = "disease_symptoms";

    //connect to database, oncetime connection, later can use getDB directly to access the database
    await connect(process.env.MONGO_URI, "diseaseSymptomsDB");

    app.get("/welcome", (req, res) => {
        res.json({
            message: "welcome to disease symptom db"
        })
    })

    /*CRUD below */
    /*{
        "disease": "flu",
        "symptoms": "cough,blocked nose",
    } */
    /*1 create*/
    app.post("/disease_symptoms", async (req, res) => {
        try {
            // console.log(req.body);
            let disease = req.body.disease;
            let symptom = req.body.symptoms.split(",");
            let datetime = new Date();

            //get db
            const db = getDB();
            await db.collection(COLLECTION_NAME).insertOne({
                disease,
                symptom,
                datetime
            })
            res.status(200);
            res.json({
                "message": "successly post one disease"
            })
        } catch {
            res.status(500);
            res.json({
                message: "failed to post to server"
            })
        }
    })

    /*read*/
    app.get("/disease_symptoms", async (req, res) => {
        //req.query = ?disease="dengue"&symptoms="cough" = {disease: "dengue", symptoms: "cough"}
        // console.log(req.query);

        let criteria = {};


        if (req.query.disease) {
            criteria["disease"] = {
                "$regex": req.query.disease,
                "$options": "i"
            };
        }

        if (req.query.symptom) {
            criteria["symptom"] = {
                "$in": [req.query.symptom]
            };
        }
        // read from right to left, flu is in disease, cough is in array symptom
        // {
        //     disease: { '$regex': 'flu', options: 'i' },
        //     symptom: { '$in': [ 'cough' ] }
        //   }

        // console.log(criteria);

        const db = getDB();
        let diseaseSymptoms = await db.collection(COLLECTION_NAME).find(criteria).toArray();
        res.json({
            data: diseaseSymptoms
        })
    })

    /*update*/

    app.put("/disease_symptoms/:id", async (req, res) => {

        try {
            // let {disease, symptom} = req.body;
            // console.log(req.body);
            let disease = req.body.disease;
            // console.log("symptom",req.body.symptom);
            let symptom = req.body.symptom.split(",").map(el => el.trim());
            // console.log(disease, symptom)
            datetime = new Date();

            await getDB().collection(COLLECTION_NAME).updateOne({
                "_id": ObjectId(req.params.id)
            }, {
                "$set": {
                    disease,
                    symptom,
                    datetime
                }
            })

            res.status(200);
            res.json({
                message: `modified one`
            })

        } catch (error) {
            res.status(505);
            res.json({
                message: "update failed"
            })
            console.log(error);
        }

    })

    /*delete */
    app.delete("/disease_symptoms/:id", async (req, res) => {
        await getDB().collection(COLLECTION_NAME).deleteOne({
            "_id": ObjectId(req.params.id)
        })
        res.status(200)
        res.json({
            message: "deleted successfully"
        })
    })
}

main();

//3. listen process.env.PORT
app.listen(process.env.PORT, () => {
    console.log("server has started")
})