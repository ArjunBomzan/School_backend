const moment = require("moment");
const mongoose = require("mongoose");
const Subject = require("../Schema/Subject");
const Chapter = require("../Schema/Chapter");

async function planStudy(req, res) {
  try {
    const { startdate: startDate, semesterId } = req.body;

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

    // Fetch subjects
    const subjects = await Subject.aggregate([
      { $match: { semesterId: new mongoose.Types.ObjectId(semesterId) } },
      { $sort: { examDate: 1 } },
    ]);

    if (!subjects.length) {
      return res.status(404).json({
        success: false,
        message: "No subjects found for the given semester ID",
      });
    }

    // Fetch and process subject details
    const subjectDetails = await processSubjects(
      subjects,
      startDate,
      preferences
    );

    // Generate study plan
    const studyPlan = generateStudyPlan(subjectDetails, startDate, preferences);

    // // Verify and adjust plan
    // const adjustedPlan = await verifyAndAdjustPlan(
    //   studyPlan,
    //   subjectDetails,
    //   preferences
    // );

    // // Organize final plan
    // const finalPlan = organizePlan(adjustedPlan);

    return res.status(200).json({
      success: true,
      message: "Study plan generated successfully",
      studyPlan: studyPlan,
      metadata: generateMetadata(studyPlan, subjectDetails, preferences),
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

// Helper functions

async function processSubjects(subjects, startDate, preferences) {
  const subjectDetails = [];

  for (const subject of subjects) {
    const chapters = await Chapter.find({ subjectId: subject._id });
    const daysUntilExam = Math.max(
      1,
      moment(subject.examDate).diff(moment(startDate), "days")
    );

    subjectDetails.push({
      subject,
      chapters,
      daysUntilExam,
      complexity: calculateComplexity(chapters, preferences.difficultyWeights),
      priority: calculatePriority({
        daysUntilExam,
        chaptersCount: chapters.length,
        difficulty: calculateComplexity(
          chapters,
          preferences.difficultyWeights
        ),
        userPriority: preferences.subjectPriorities[subject._id] || 1,
      }),
    });
  }

  return subjectDetails.sort((a, b) => b.priority - a.priority);
}

function calculateComplexity(chapters, weights) {
  if (!chapters.length) return 1;
  return (
    chapters.reduce((sum, chapter) => sum + (weights[chapter._id] || 1), 0) /
    chapters.length
  );
}

function calculatePriority({
  daysUntilExam,
  chaptersCount,
  difficulty,
  userPriority,
}) {
  const timeWeight = 1000 / (daysUntilExam + 1);
  const contentWeight = Math.log(chaptersCount + 1);
  return timeWeight * contentWeight * (difficulty * 0.5 + userPriority * 2);
}

function generateStudyPlan(subjectDetails, startDate, preferences) {
  const plan = [];
  const currentDate = moment(startDate);
  const lastExamDate = moment.max(
    subjectDetails.map((detail) => moment(detail.subject.examDate))
  );

  while (currentDate.isSameOrBefore(lastExamDate)) {
    if (!shouldSkipDate(currentDate, preferences)) {
      const daySlots = generateTimeSlots(preferences);
      const dayPlan = allocateStudySessions(
        subjectDetails,
        currentDate,
        daySlots,
        preferences
      );
      plan.push(...dayPlan);
    }
    currentDate.add(1, "day");
  }

  return plan;
}

function shouldSkipDate(date, preferences) {
  const dayName = date.format("dddd").toLowerCase();
  return (
    preferences.excludeDates.includes(date.format("YYYY-MM-DD")) ||
    !preferences.preferredStudyDays.includes(dayName)
  );
}

function generateTimeSlots(preferences) {
  const timeSlots = {
    morning: ["08:00", "09:00", "10:00", "11:00"],
    afternoon: ["13:00", "14:00", "15:00", "16:00"],
    evening: ["18:00", "19:00", "20:00", "21:00"],
  };

  return preferences.preferredTimeSlots
    .flatMap((period) =>
      timeSlots[period].map((time) => ({
        startTime: time,
        endTime: moment(time, "HH:mm")
          .add(preferences.minTimePerSession, "hours")
          .format("HH:mm"),
        duration: preferences.minTimePerSession,
      }))
    )
    .slice(0, preferences.maxStudySessionsPerDay);
}

function allocateStudySessions(subjectDetails, date, slots, preferences) {
  const sessions = [];
  let slotIndex = 0;

  for (const detail of subjectDetails) {
    if (slotIndex >= slots.length) break;
    if (moment(detail.subject.examDate).isBefore(date)) continue;

    const chaptersForToday = calculateChaptersPerDay(detail, date, preferences);

    for (let i = 0; i < chaptersForToday && slotIndex < slots.length; i++) {
      const slot = slots[slotIndex++];
      const chapter = detail.chapters[i];

      if (chapter) {
        sessions.push({
          date: date.format("YYYY-MM-DD"),
          subject: detail.subject.name,
          subjectId: detail.subject._id,
          chapter: chapter.name,
          chapterId: chapter._id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          duration: slot.duration,
          priority: detail.priority,
          difficulty: preferences.difficultyWeights[chapter._id] || 1,
          isRevision: false,
        });
      }
    }
  }

  return sessions;
}

function calculateChaptersPerDay(subjectDetail, currentDate, preferences) {
  const baseCount = Math.ceil(
    subjectDetail.chapters.length / subjectDetail.daysUntilExam
  );
  const difficultyFactor = 1 / subjectDetail.complexity;
  return Math.max(
    1,
    Math.min(
      Math.ceil(baseCount * difficultyFactor),
      preferences.maxStudySessionsPerDay
    )
  );
}

function organizePlan(plan) {
  const organized = {};

  for (const session of plan) {
    if (!organized[session.date]) {
      organized[session.date] = [];
    }
    organized[session.date].push(session);
  }

  // Sort sessions within each day
  for (const date in organized) {
    organized[date].sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return moment(a.startTime, "HH:mm").diff(moment(b.startTime, "HH:mm"));
    });
  }

  return organized;
}

function generateMetadata(plan, subjectDetails, preferences) {
  const flatPlan = Object.values(plan).flat();

  return {
    totalDays: Object.keys(plan).length,
    totalStudyHours: flatPlan.reduce(
      (sum, session) => sum + session.duration,
      0
    ),
    subjectsBreakdown: subjectDetails.map((detail) => ({
      subject: detail.subject.name,
      totalChapters: detail.chapters.length,
      plannedSessions: flatPlan.filter(
        (s) => s.subjectId.toString() === detail.subject._id.toString()
      ).length,
      revisionSessions: flatPlan.filter(
        (s) =>
          s.subjectId.toString() === detail.subject._id.toString() &&
          s.isRevision
      ).length,
    })),
    preferences: {
      studyDays: preferences.preferredStudyDays,
      timeSlots: preferences.preferredTimeSlots,
      dailyHours: preferences.dailyStudyHours,
    },
  };
}

function generateRecommendations(preferences) {
  return {
    breaks: `Take ${preferences.breakBetweenSessions}-minute breaks between sessions`,
    routine:
      "Start with high-priority subjects during your peak concentration hours",
    revisions: `Review topics every ${preferences.reviewFrequency} days`,
    health: [
      "Stay hydrated",
      "Follow the 20-20-20 rule for eye care",
      "Maintain good posture",
      "Ensure proper lighting",
    ],
    timeManagement: [
      "Use the Pomodoro technique",
      "Start with quick reviews",
      "End sessions with summaries",
    ],
  };
}

module.exports = planStudy;
