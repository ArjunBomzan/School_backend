const Semester = require("../Schema/Semester");
async function createSemester(req, res, next) {
  console.log(res.body);
  try {
    data = await Semester(req.body).save();
    res.status(200).send({ message: "Semester created successfully" });
  } catch (err) {
    next(err);
  }
}
async function getSemester(req, res, next) {
  try {
    data = await Semester.aggregate([
      {
        $lookup: {
          from: "subjects",
          localField: "_id",
          foreignField: "semesterId",
          as: "subjects",
        },
      },
      {
        $addFields: {
          subjectCount: { $size: "$subjects" },
        },
      },
      {
        $project: {
          semesterNumber: 1,
          semesterName: 1,
          subjectCount: 1,
        },
      },
    ]);

    res.status(200).send(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { createSemester, getSemester };
