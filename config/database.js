require("dotenv").config();
const mongoose = require("mongoose");
try {
  mongoose
    .connect(process.env.DATABASEURL)
    .then(() => console.log("Connected!"));
} catch (err) {
  next(err);
}
