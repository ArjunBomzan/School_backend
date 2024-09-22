const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const contributeSchema = new Schema({
  semesterId: {
    type: ObjectId,
    ref: "Semester",
    required: true,
  },
  subjectId: {
    type: ObjectId,
    ref: "Subject",
    required: true,
  },
  chapterId: {
    type: ObjectId,
    ref: "Chapter",
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  pdf: {
    type: String,
  },
  Author: {
    type: String,
  },
});

const contribute = mongoose.model("Contribute", contributeSchema);
module.exports = contribute;
