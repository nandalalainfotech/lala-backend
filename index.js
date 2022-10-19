import express from 'express';
const app = express();
import { connect } from 'mongoose';

// eslint-disable-next-line no-undef
require('dotenv').config()

// eslint-disable-next-line no-undef
const connection_string = process.env.CONNECTION_STRING
//const port = process.env.PORT || 80

app.get('/', (req, res) => {
    res.send("Welcome to our ToDo")
})

app.listen(80,() =>{
    console.log("Server running on port 80.")
})

connect(connection_string, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true

})
.then(() => console.log('MongoDB connection established.'))
.catch((error) => console.error("MongoDB connection failed:", error.message))