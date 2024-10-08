const express = require("express");
const {
  createSubject,
  getSubjectBySemester,
  getSubjects,
  getSubjectById,
  deleteSubject,
} = require("../controller/subject");

router = express.Router();

// router.get("",get)
router.post("/subject", createSubject);
router.get("/subjects", getSubjects);
router.get("/subjects/:id", getSubjectById);
router.get("/semesterwiseSubjects/:id", getSubjectBySemester);
router.delete("/subject/:id", deleteSubject);

module.exports = router;
