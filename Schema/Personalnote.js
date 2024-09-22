const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const personalnoteSchema = new Schema({
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
    type: ObjectId,
    ref: "User",
  },
});

const personalnote = mongoose.model("Personalnote", personalnoteSchema);
module.exports = personalnote;
