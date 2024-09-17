const express = require("express");
const { createChapter, getChapterBySubject } = require("../controller/chapter");

router = express.Router();

// router.get("",get)
router.post("/chapter", createChapter);
router.get("/chapters/:id", getChapterBySubject);

module.exports = router;
