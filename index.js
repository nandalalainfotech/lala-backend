import express from 'express';
import { connect } from 'mongoose';
import bodyParser from "body-parser";
import cors from "cors";

require('dotenv').config()
const app = express();
const connection_string = 'mongodb+srv://nandalala:Spartans!23@cluster0.ujwabrm.mongodb.net/laladb?retryWrites=true&w=majority';
// const connection_string = 'mongodb://127.0.0.1/amazona';

app.get('/', (req, res) => {
    res.send("Welcome to our ToDo")
})

app.listen(80, () => {
    console.log("Server running on port 80.")
})
app.use(cors());
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type, Accept,X-Requested-With");
    res.header("Access-Control-Allow-Methods", "POST, GET, PUT, UPDATE, OPTIONS, HEAD")
    next();
});
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
connect(connection_string, {
        useNewUrlParser: true,
        useCreateIndex: false,
        useUnifiedTopology: true

    })
    .then(() => console.log('MongoDB connection established.'))
    .catch((error) => console.error("MongoDB connection failed:", error.message))