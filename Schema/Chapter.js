// const { required, number } = require("joi");
const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const chapterSchema = new Schema({
  subjectId: {
    type: ObjectId,
    ref: "Subject",
    required: true,
  },
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },

  details: {
    type: String,
  },
  pdf: {
    type: String,
  },
  deficulty: {
    type: Number,
  },
});

const chapter = mongoose.model("Chapter", chapterSchema);
module.exports = chapter;
