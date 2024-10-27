const mongoose = require("mongoose");
const moment = require("moment");
const Chapter = require("../../Schema/Chapter");

async function processSubjects(subjects, startDate, preferences) {
  try {
    const processedSubjects = [];
    const startMoment = moment(startDate);

    for (const subject of subjects) {
      // Fetch chapters for the subject
      const chapters = await Chapter.find(
        { subjectId: subject._id },
        { details: 0, pdf: 0 }
      );

      // Calculate total chapters and estimate study time needed
      const totalChapters = chapters.length;
      let totalStudyTimeNeeded = 0;

      const processedChapters = chapters.map((chapter) => {
        // Base study time in hours - assuming average chapter takes 2 hours
        const baseTime = 2;

        // Apply difficulty multiplier (1-3 scale, default to 1)
        const difficultyMultiplier =
          preferences.difficultyWeights[chapter._id.toString()] || 1;

        // Apply priority multiplier (1-3 scale, default to 1)
        const priorityMultiplier =
          preferences.subjectPriorities[subject._id.toString()] || 1;

        // Calculate chapter study time
        const studyTimeNeeded =
          baseTime * difficultyMultiplier * priorityMultiplier;
        totalStudyTimeNeeded += studyTimeNeeded;

        return {
          _id: chapter._id,
          name: chapter.name,
          studyTimeNeeded,
          difficulty: difficultyMultiplier,
          priority: priorityMultiplier,
          status: "pending",
        };
      });

      // Calculate days until exam
      const daysUntilExam = moment(subject.examDate).diff(startMoment, "days");

      // Calculate revision time (20% of total study time)
      const revisionTime = totalStudyTimeNeeded * 0.2;

      // Calculate daily study time needed
      const availableDays = Math.max(
        1,
        daysUntilExam - preferences.revisionDaysBeforeExam
      );
      const dailyStudyTimeNeeded =
        (totalStudyTimeNeeded + revisionTime) / availableDays;

      processedSubjects.push({
        _id: subject._id,
        name: subject.name,

        examDate: subject.examDate,
        chapters: processedChapters,
        metadata: {
          totalChapters,
          totalStudyTimeNeeded,
          revisionTimeNeeded: revisionTime,
          daysUntilExam,
          availableDays,
          dailyStudyTimeNeeded,
          priority: preferences.subjectPriorities[subject._id.toString()] || 1,
          averageDifficulty:
            processedChapters.reduce(
              (acc, chapter) => acc + chapter.difficulty,
              0
            ) / totalChapters,
        },
      });
    }

    // Sort subjects by priority and exam date
    processedSubjects.sort((a, b) => {
      // First sort by exam date
      const dateComparison = moment(a.examDate).diff(moment(b.examDate));
      if (dateComparison !== 0) return dateComparison;

      // Then by priority (higher priority first)
      const priorityDiff = b.metadata.priority - a.metadata.priority;
      if (priorityDiff !== 0) return priorityDiff;

      // Finally by difficulty (harder subjects first)
      return b.metadata.averageDifficulty - a.metadata.averageDifficulty;
    });

    return processedSubjects;
  } catch (error) {
    console.error("Error processing subjects:", error);
    throw error;
  }
}

function generateStudyPlan(subjectDetails, startDate, preferences) {
  const studyPlan = [];
  const startMoment = moment(startDate);

  // Helper function to check if a date should be excluded
  const isExcludedDate = (date) => {
    return preferences.excludeDates.some((excludeDate) =>
      moment(excludeDate).isSame(date, "day")
    );
  };

  // Helper function to check if it's a preferred study day
  const isPreferredDay = (date) => {
    const dayName = date.format("dddd").toLowerCase();
    return preferences.preferredStudyDays.includes(dayName);
  };

  // Helper function to get available time slots for a day
  const getTimeSlots = (date) => {
    const slots = [];
    const timeSlotMap = {
      morning: { start: 9, end: 12 },
      afternoon: { start: 13, end: 16 },
      evening: { start: 17, end: 20 },
    };

    preferences.preferredTimeSlots.forEach((slot) => {
      const timeSlot = timeSlotMap[slot];
      if (timeSlot) {
        slots.push(timeSlot);
      }
    });

    return slots;
  };

  // Track study progress for each subject
  const subjectProgress = new Map(
    subjectDetails.map((subject) => [
      subject._id.toString(),
      {
        chaptersCompleted: 0,
        totalStudyTime: 0,
        lastStudyDate: null,
        currentChapterIndex: 0,
      },
    ])
  );

  // Generate study sessions day by day
  let currentDate = startMoment.clone();
  let lastSubjectStudied = null;

  while (true) {
    // Check if we've completed all subjects
    const allSubjectsCompleted = subjectDetails.every((subject) => {
      const progress = subjectProgress.get(subject._id.toString());
      return progress.chaptersCompleted === subject.chapters.length;
    });

    if (allSubjectsCompleted) break;

    // Skip excluded dates and non-preferred days
    if (isExcludedDate(currentDate) || !isPreferredDay(currentDate)) {
      currentDate.add(1, "day");
      continue;
    }

    const timeSlots = getTimeSlots(currentDate);
    let dailySessions = 0;
    let dailyStudyTime = 0;

    for (const timeSlot of timeSlots) {
      if (
        dailySessions >= preferences.maxStudySessionsPerDay ||
        dailyStudyTime >= preferences.dailyStudyHours
      ) {
        break;
      }

      // Find the most urgent subject to study
      const eligibleSubjects = subjectDetails
        .filter((subject) => {
          const progress = subjectProgress.get(subject._id.toString());
          const examDate = moment(subject.examDate);

          return (
            progress.chaptersCompleted < subject.chapters.length &&
            currentDate.isBefore(examDate) &&
            (!progress.lastStudyDate ||
              currentDate.diff(progress.lastStudyDate, "days") >= 1)
          );
        })
        .sort((a, b) => {
          // Sort by days until exam and priority
          const aDaysLeft = moment(a.examDate).diff(currentDate, "days");
          const bDaysLeft = moment(b.examDate).diff(currentDate, "days");

          if (Math.abs(aDaysLeft - bDaysLeft) > 7) {
            return aDaysLeft - bDaysLeft;
          }

          return (
            (preferences.subjectPriorities[b._id.toString()] || 1) -
            (preferences.subjectPriorities[a._id.toString()] || 1)
          );
        });

      if (eligibleSubjects.length === 0) break;

      // Prefer a different subject than the last one studied
      const subjectToStudy =
        eligibleSubjects.find(
          (subject) => subject._id.toString() !== lastSubjectStudied
        ) || eligibleSubjects[0];

      const progress = subjectProgress.get(subjectToStudy._id.toString());
      const currentChapter =
        subjectToStudy.chapters[progress.currentChapterIndex];

      // Calculate study duration for this session
      const remainingChapterTime =
        currentChapter.studyTimeNeeded - progress.totalStudyTime;
      const sessionDuration = Math.min(
        remainingChapterTime,
        preferences.maxTimePerSession,
        preferences.dailyStudyHours - dailyStudyTime
      );

      if (sessionDuration < preferences.minTimePerSession) continue;

      // Create study session
      const session = {
        date: currentDate.format("YYYY-MM-DD"),
        timeSlot: {
          start: timeSlot.start,
          end: Math.min(timeSlot.start + sessionDuration, timeSlot.end),
        },
        subject: {
          _id: subjectToStudy._id,
          name: subjectToStudy.name,
        },
        chapter: {
          _id: currentChapter._id,
          name: currentChapter.name,
        },
        duration: sessionDuration,
        type: "study",
        progress: {
          chapterProgress: (
            ((progress.totalStudyTime + sessionDuration) /
              currentChapter.studyTimeNeeded) *
            100
          ).toFixed(1),
        },
      };

      studyPlan.push(session);

      // Update progress
      progress.totalStudyTime += sessionDuration;
      if (progress.totalStudyTime >= currentChapter.studyTimeNeeded) {
        progress.chaptersCompleted++;
        progress.currentChapterIndex++;
        progress.totalStudyTime = 0;
      }
      progress.lastStudyDate = currentDate.clone();

      lastSubjectStudied = subjectToStudy._id.toString();
      dailySessions++;
      dailyStudyTime += sessionDuration;

      // Add revision sessions for completed chapters
      if (
        progress.chaptersCompleted > 0 &&
        progress.chaptersCompleted % preferences.reviewFrequency === 0
      ) {
        studyPlan.push({
          date: currentDate.format("YYYY-MM-DD"),
          timeSlot: {
            start: timeSlot.end - 1,
            end: timeSlot.end,
          },
          subject: {
            _id: subjectToStudy._id,
            name: subjectToStudy.name,
          },
          type: "revision",
          duration: 1,
          chaptersToReview: subjectToStudy.chapters
            .slice(0, progress.chaptersCompleted)
            .map((ch) => ({ _id: ch._id, name: ch.name })),
        });
      }
    }

    currentDate.add(1, "day");
  }

  // Add final revision sessions before exams
  subjectDetails.forEach((subject) => {
    const examDate = moment(subject.examDate);
    const revisionStartDate = examDate
      .clone()
      .subtract(preferences.revisionDaysBeforeExam, "days");

    for (
      let date = revisionStartDate.clone();
      date.isBefore(examDate);
      date.add(1, "day")
    ) {
      if (!isExcludedDate(date) && isPreferredDay(date)) {
        const timeSlots = getTimeSlots(date);

        timeSlots.forEach((timeSlot, index) => {
          if (index < 2) {
            // Maximum 2 revision sessions per day
            studyPlan.push({
              date: date.format("YYYY-MM-DD"),
              timeSlot: {
                start: timeSlot.start,
                end: timeSlot.start + 2,
              },
              subject: {
                _id: subject._id,
                name: subject.name,
              },
              type: "final_revision",
              duration: 2,
              chaptersToReview: subject.chapters.map((ch) => ({
                _id: ch._id,
                name: ch.name,
              })),
            });
          }
        });
      }
    }
  });

  // Sort the study plan chronologically
  studyPlan.sort((a, b) => {
    const dateComparison = moment(a.date).diff(moment(b.date));
    if (dateComparison !== 0) return dateComparison;
    return a.timeSlot.start - b.timeSlot.start;
  });

  return studyPlan;
}

function organizePlan(studyPlan) {
  // First, group by weeks and days
  const organizedPlan = {};

  studyPlan.forEach((session) => {
    const date = moment(session.date);
    const weekNumber = date.isoWeek();
    const year = date.year();
    const weekKey = `${year}-W${weekNumber.toString().padStart(2, "0")}`;
    const dayKey = session.date;

    // Initialize week if it doesn't exist
    if (!organizedPlan[weekKey]) {
      organizedPlan[weekKey] = {
        weekNumber,
        year,
        startDate: date.startOf("isoWeek").format("YYYY-MM-DD"),
        endDate: date.endOf("isoWeek").format("YYYY-MM-DD"),
        totalStudyHours: 0,
        totalSessions: 0,
        days: {},
        weekSummary: {
          subjectsStudied: new Set(),
          chaptersCompleted: 0,
          revisionSessions: 0,
          studySessions: 0,
        },
      };
    }

    // Initialize day if it doesn't exist
    if (!organizedPlan[weekKey].days[dayKey]) {
      organizedPlan[weekKey].days[dayKey] = {
        date: dayKey,
        dayOfWeek: date.format("dddd"),
        sessions: [],
        dailySummary: {
          totalHours: 0,
          subjects: new Set(),
          sessionTypes: {
            study: 0,
            revision: 0,
            final_revision: 0,
          },
        },
      };
    }

    // Add formatted session
    const formattedSession = {
      ...session,
      timeSlot: {
        ...session.timeSlot,
        formattedStart: formatTime(session.timeSlot.start),
        formattedEnd: formatTime(session.timeSlot.end),
      },
      duration: session.duration,
      formattedDuration: formatDuration(session.duration),
    };

    // Update daily summary
    const day = organizedPlan[weekKey].days[dayKey];
    day.sessions.push(formattedSession);
    day.dailySummary.totalHours += session.duration;
    day.dailySummary.subjects.add(session.subject.name);
    day.dailySummary.sessionTypes[session.type]++;

    // Update weekly summary
    const week = organizedPlan[weekKey];
    week.totalStudyHours += session.duration;
    week.totalSessions++;
    week.weekSummary.subjectsStudied.add(session.subject.name);

    if (session.type === "study" && session.progress?.chapterProgress >= 100) {
      week.weekSummary.chaptersCompleted++;
    }
    if (session.type === "revision" || session.type === "final_revision") {
      week.weekSummary.revisionSessions++;
    } else {
      week.weekSummary.studySessions++;
    }
  });

  // Convert Sets to arrays and format summaries
  const finalOrganizedPlan = {};
  Object.entries(organizedPlan).forEach(([weekKey, week]) => {
    const formattedWeek = {
      ...week,
      weekSummary: {
        ...week.weekSummary,
        subjectsStudied: Array.from(week.weekSummary.subjectsStudied),
        totalStudyHours: week.totalStudyHours.toFixed(1),
        averageHoursPerDay: (
          week.totalStudyHours / Object.keys(week.days).length
        ).toFixed(1),
      },
      days: {},
    };

    // Format days
    Object.entries(week.days).forEach(([dayKey, day]) => {
      formattedWeek.days[dayKey] = {
        ...day,
        dailySummary: {
          ...day.dailySummary,
          subjects: Array.from(day.dailySummary.subjects),
          totalHours: day.dailySummary.totalHours.toFixed(1),
        },
      };
    });

    finalOrganizedPlan[weekKey] = formattedWeek;
  });

  return {
    weeklyPlans: finalOrganizedPlan,
    overview: generateOverview(finalOrganizedPlan),
  };
}

// Helper function to format time (24-hour format)
function formatTime(hour) {
  return `${hour.toString().padStart(2, "0")}:00`;
}

// Helper function to format duration
function formatDuration(hours) {
  const totalMinutes = Math.round(hours * 60);
  const formattedHours = Math.floor(totalMinutes / 60);
  const formattedMinutes = totalMinutes % 60;

  if (formattedHours === 0) {
    return `${formattedMinutes}min`;
  } else if (formattedMinutes === 0) {
    return `${formattedHours}h`;
  } else {
    return `${formattedHours}h ${formattedMinutes}min`;
  }
}

// Helper function to generate overall study plan overview
function generateOverview(organizedPlan) {
  const overview = {
    totalWeeks: Object.keys(organizedPlan).length,
    totalStudyHours: 0,
    totalSessions: 0,
    totalStudyDays: 0,
    subjectsProgress: new Map(),
    studyDistribution: {
      study: 0,
      revision: 0,
      final_revision: 0,
    },
    weeklyAverages: {
      hoursPerWeek: 0,
      sessionsPerWeek: 0,
      daysPerWeek: 0,
    },
  };

  Object.values(organizedPlan).forEach((week) => {
    overview.totalStudyHours += parseFloat(week.weekSummary.totalStudyHours);
    overview.totalSessions += week.totalSessions;
    overview.totalStudyDays += Object.keys(week.days).length;

    // Count session types
    Object.values(week.days).forEach((day) => {
      Object.entries(day.dailySummary.sessionTypes).forEach(([type, count]) => {
        overview.studyDistribution[type] += count;
      });
    });
  });

  // Calculate averages
  const numWeeks = overview.totalWeeks;
  overview.weeklyAverages = {
    hoursPerWeek: (overview.totalStudyHours / numWeeks).toFixed(1),
    sessionsPerWeek: (overview.totalSessions / numWeeks).toFixed(1),
    daysPerWeek: (overview.totalStudyDays / numWeeks).toFixed(1),
  };

  return {
    ...overview,
    totalStudyHours: overview.totalStudyHours.toFixed(1),
    averageHoursPerDay: (
      overview.totalStudyHours / overview.totalStudyDays
    ).toFixed(1),
  };
}

module.exports = { processSubjects, generateStudyPlan, organizePlan };
