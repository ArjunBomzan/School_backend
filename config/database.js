require("dotenv").config();
const mongoose = require("mongoose");

mongoose.connect(process.env.DATABASEURL).then(() => console.log("Connected!"));
