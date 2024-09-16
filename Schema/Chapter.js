const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const chapterSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  title: {
    type: String,
  },
  details: {
    type: String,
  },
});

const chapter = mongoose.model("Chapter", chapterSchema);
module.exports = chapter;
