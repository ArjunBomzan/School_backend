const express = require("express");
const { getSemester, createSemester } = require("../controller/semester");

router = express.Router();

// router.get("",get)
router.post("/semester", createSemester);
// router.get("/semester/:id");
router.get("/semesters", getSemester);

module.exports = router;
