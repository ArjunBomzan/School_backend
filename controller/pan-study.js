const mongoose = require("mongoose");
const Subject = require("../Schema/Subject");
const Chapter = require("../Schema/Chapter");
const moment = require("moment");

async function planStudy(req, res) {
  try {
    const {
      startdate: startDate,
      semesterId,
      examDates, // New: Object mapping subjectId to examDate
    } = req.body;

    // Validate exam dates
    if (!examDates || typeof examDates !== "object") {
      return res.status(400).json({
        success: false,
        message:
          "Exam dates must be provided as an object mapping subject IDs to dates",
      });
    }

    // Default preferences with safety checks
    const preferences = {
      dailyStudyHours: Math.min(req.body.dailyStudyHours || 6, 12),
      minTimePerSession: Math.max(req.body.minTimePerSession || 1, 0.5),
      maxTimePerSession: Math.min(req.body.maxTimePerSession || 3, 4),
      preferredStudyDays: req.body.preferredStudyDays || [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ],
      preferredTimeSlots: req.body.preferredTimeSlots || [
        "morning",
        "afternoon",
        "evening",
      ],
      breakBetweenSessions: Math.min(req.body.breakBetweenSessions || 15, 30),
      longBreakAfterHours: Math.min(req.body.longBreakAfterHours || 3, 4),
      subjectPriorities: req.body.subjectPriorities || {},
      difficultyWeights: req.body.difficultyWeights || {},
      reviewFrequency: Math.min(req.body.reviewFrequency || 3, 7),
      revisionDaysBeforeExam: Math.min(req.body.revisionDaysBeforeExam || 3, 7),
      maxStudySessionsPerDay: Math.min(req.body.maxStudySessionsPerDay || 4, 6),
      excludeDates: req.body.excludeDates || [],
      importantDates: req.body.importantDates || [],
    };

    // Input validation
    if (!startDate || !semesterId) {
      return res.status(400).json({
        success: false,
        message: "Start date and semester ID are required",
      });
    }

    // Fetch subjects without sorting by examDate
    const subjects = await Subject.aggregate([
      { $match: { semesterId: new mongoose.Types.ObjectId(semesterId) } },
    ]);

    if (!subjects.length) {
      return res.status(400).json({
        success: false,
        message: "No subjects found for the given semester ID",
      });
    }

    // Validate exam dates for all subjects
    for (const subject of subjects) {
      if (!examDates[subject._id.toString()]) {
        return res.status(400).json({
          success: false,
          message: `Exam date not provided for subject: ${subject.name}`,
        });
      }

      const examDate = moment(examDates[subject._id.toString()]);
      if (!examDate.isValid()) {
        return res.status(400).json({
          success: false,
          message: `Invalid exam date for subject: ${subject.name}`,
        });
      }
    }

    // Add exam dates to subjects
    const subjectsWithExamDates = subjects.map((subject) => ({
      ...subject,
      examDate: examDates[subject._id.toString()],
    }));

    // Sort subjects by exam date
    subjectsWithExamDates.sort((a, b) =>
      moment(a.examDate).diff(moment(b.examDate))
    );

    // Process subjects with exam dates
    const subjectDetails = await processSubjects(
      subjectsWithExamDates,
      startDate,
      preferences
    );

    // Generate study plan
    const studyPlan = generateStudyPlan(subjectDetails, startDate, preferences);

    // Organize final plan
    const organizedPlan = organizePlan(studyPlan);

    return res.status(200).json({
      success: true,
      message: "Study plan generated successfully",
      studyPlan: organizedPlan,
      metadata: generateMetadata(organizedPlan, subjectDetails, preferences),
      recommendations: generateRecommendations(preferences),
    });
  } catch (error) {
    console.error("Study plan generation error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate study plan",
      error: error.message,
    });
  }
}

// Helper functions remain the same, just update the exports
module.exports = planStudy;
