const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const semesterSchema = new Schema({
  semesterNumber: {
    type: Number,
    required: true,
    unique: true,
  },
  semesterName: {
    type: String,
    required: true,
  },
});

const Semester = mongoose.model("Semester", semesterSchema);
module.exports = Semester;
