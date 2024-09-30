const moment = require("moment");
const Subject = require("../Schema/Subject");
const Chapter = require("../Schema/Chapter");

async function planStudy(req, res, next) {
  try {
    const startDate = req.body.startdate;
    const semesterId = req.body.semester;

    // Fetch subjects for the given semester
    const subjects = await Subject.find({ semesterId: semesterId });

    if (!subjects || subjects.length === 0) {
      return res
        .status(404)
        .send("No subjects found for the given semester ID.");
    }

    // Initialize an empty study plan array
    const studyPlan = [];

    // Generate the study plan for each subject
    for (const subject of subjects) {
      // Fetch chapters for the current subject
      const chapters = await Chapter.find({ subjectId: subject._id });

      const daysUntilExam = moment(subject.examDate).diff(
        moment(startDate),
        "days"
      );
      const daysPerChapter = Math.ceil(daysUntilExam / chapters.length);

      for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i];
        const studyDay = moment(startDate).add(i * daysPerChapter, "days");

        // Add the study session to the study plan array
        studyPlan.push({
          date: studyDay.format("YYYY-MM-DD"),
          subject: subject.name,
          chapter: chapter.name, 
          examDate: subject.examDate,
        });
      }
    }

    // Send the generated study plan as response
    res.status(200).json({
      success: true,
      message: "Study plan generated successfully",
      studyPlan: studyPlan,
    });
  } catch (error) {
    console.error("Error generating study plan:", error);
    res.status(500).send("Internal Server Error");
  }
}

module.exports = planStudy;
