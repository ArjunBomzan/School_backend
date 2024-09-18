const express = require("express");
const {
  createSubject,
  getSubjectBySemester,
  getSubjects,
  getSubjectById,
} = require("../controller/subject");

router = express.Router();

// router.get("",get)
router.post("/subject", createSubject);
router.get("/subjects", getSubjects);
router.get("/subjects/:id", getSubjectById);
router.get("/ /:id", getSubjectBySemester);

module.exports = router;
