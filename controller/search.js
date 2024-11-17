const Chapter = require("../Schema/Chapter");
const Subject = require("../Schema/Subject");
const Semester = require("../Schema/Semester");

async function search(req, res, next) {
  const searchTerm = req.query.search;
  if (!searchTerm || searchTerm.length < 3) {
    return res.status(400).json({
      error: "Search term must be at least 3 characters long.",
    });
  }
  const cleanSearchTerm = searchTerm.replace(/['"]+/g, "");

  try {
    const searchWords = cleanSearchTerm
      .split(" ")
      .filter((word) => word.length > 0);
    const searchPattern = searchWords
      .map((word) => `(?i)${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`)
      .join("|");

    const subjectPipeline = [
      {
        $match: {
          $or: [
            { name: { $regex: searchPattern } },
            { code: { $regex: searchPattern } },
            { description: { $regex: searchPattern } },
          ],
        },
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
        $lookup: {
          from: "semesters",
          localField: "semesterId",
          foreignField: "_id",
          as: "semester",
        },
      },

      {
        $unwind: {
          path: "$semester",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $addFields: {
          matchScore: {
            $add: [
              {
                $cond: {
                  if: { $regexMatch: { input: "$name", regex: searchPattern } },
                  then: 3,
                  else: 0,
                },
              },
              {
                $cond: {
                  if: { $regexMatch: { input: "$code", regex: searchPattern } },
                  then: 2,
                  else: 0,
                },
              },
              {
                $cond: {
                  if: {
                    $regexMatch: {
                      input: "$description",
                      regex: searchPattern,
                    },
                  },
                  then: 1,
                  else: 0,
                },
              },
            ],
          },
        },
      },

      {
        $sort: {
          matchScore: -1,
          name: 1,
        },
      },

      {
        $project: {
          _id: 1,
          name: 1,
          code: 1,
          description: 1,
          semester: {
            _id: "$semester._id",
            name: "$semester.name",
            description: "$semester.description",
          },
          chapters: {
            $map: {
              input: "$chapters",
              as: "chapter",
              in: {
                _id: "$$chapter._id",
                name: "$$chapter.name",
                description: "$$chapter.description",
                chapterNumber: "$$chapter.chapterNumber",
              },
            },
          },
          matchScore: 1,
        },
      },
    ];

    const chapterPipeline = [
      {
        $match: {
          $or: [
            { name: { $regex: searchPattern } },
            { description: { $regex: searchPattern } },
          ],
        },
      },
      // Lookup subject for each chapter
      {
        $lookup: {
          from: "subjects",
          localField: "subjectId",
          foreignField: "_id",
          as: "subject",
        },
      },
      {
        $unwind: {
          path: "$subject",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: "semesters",
          localField: "subject.semesterId",
          foreignField: "_id",
          as: "semester",
        },
      },
      {
        $unwind: {
          path: "$semester",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          chapterNumber: 1,
          subject: {
            _id: "$subject._id",
            name: "$subject.name",
            code: "$subject.code",
          },
          semester: {
            _id: "$semester._id",
            name: "$semester.name",
          },
        },
      },
    ];

    // Execute both pipelines
    const [subjectResults, chapterResults] = await Promise.all([
      Subject.aggregate(subjectPipeline),
      Chapter.aggregate(chapterPipeline),
    ]);

    // Get total counts for debug info
    const [subjectCount, chapterCount, semesterCount] = await Promise.all([
      Subject.countDocuments(),
      Chapter.countDocuments(),
      Semester.countDocuments(),
    ]);

    const response = {
      results: {
        bySubject: subjectResults,

        byChapter: chapterResults,
      },
      // debug: {
      //   searchTerm: cleanSearchTerm,
      //   searchWords,
      //   searchPattern,
      //   totalCounts: {
      //     subjects: subjectCount,
      //     chapters: chapterCount,
      //     semesters: semesterCount,
      //   },
      //   matchCounts: {
      //     subjects: subjectResults.length,
      //     chapters: chapterResults.length,
      //   },
      //   timestamp: new Date().toISOString(),
      // },
    };

    res.status(200).json(response);
  } catch (err) {
    console.error("Combined search error:", err);
    next(err);
  }
}

module.exports = { search };
