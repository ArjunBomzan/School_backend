const { string } = require("joi");
const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const importantQuestionsSchema = new Schema({
  chapterId: {
    type: ObjectId,
    ref: "Chapter",
    required: true,
  },
  question: {
    type: String,
    required: true,
  },
    AskedOn: {
      type: String,
    required: true,
  },
  pdf: {
    type: String,
  },
});

const importantQuestion = mongoose.model(
  "ImportantQuestions",
  importantQuestionsSchema
);
module.exports = importantQuestion;
