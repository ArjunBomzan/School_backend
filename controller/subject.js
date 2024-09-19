const Subject = require("../Schema/Subject");
const mongoose = require("mongoose");
async function createSubject(req, res, next) {
  try {
    data = await Subject(req.body).save();
    res.status(200).send({ message: "SUbject created successfully" });
  } catch (err) {
    next(err);
  }
}
async function getSubjectBySemester(req, res, next) {
  const semesterId = req.params.id;

  try {
    data = await Subject.aggregate([
      {
        $match: { semesterId: new mongoose.Types.ObjectId(semesterId) },
      },
      {
        $lookup: {
          from: "chapters",
          localField: "_id",
          foreignField: "subjectId",
          as: "chapters",
        },
      },
      {
        $addFields: {
          chapterCount: { $size: "$chapters" },
        },
      },
      {
        $project: {
          name: 1,
          description: 1,
          code: 1,
          semesterId: 1,
          chapterCount: 1,
        },
      },
    ]);

    res.status(200).send(data);
  } catch (err) {
    next(err);
  }
}

async function getSubjects(req, res, next) {
  try {
    data = await Subject.find().populate("semesterId");
    res.status(200).send(data);
  } catch (err) {
    next(err);
  }
}
async function getSubjectById(req, res, next) {
  const id = req.params.id;
  try {
    data = await Subject.findById(id);

    res.status(200).send(data);
  } catch (err) {
    next(err);
  }
}
module.exports = {
  createSubject,
  getSubjectBySemester,
  getSubjects,
  getSubjectById,
};
