const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const subjectSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },

  code: {
    type: String,
    required: true,
  },
  semesterId: {
    type: Schema.Types.ObjectId,
    ref: "Semester",
    required: true,
  },
});

const Subject = mongoose.model("Subject", subjectSchema);
module.exports = Subject;
