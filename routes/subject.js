const express = require("express");
const {
  createSubject,
  getSubjectBySemester,
} = require("../controller/subject");

router = express.Router();

// router.get("",get)
router.post("/subject", createSubject);
// router.get("/semester/:id");
router.get("/subjectsBySemester/:id", getSubjectBySemester);

module.exports = router;
