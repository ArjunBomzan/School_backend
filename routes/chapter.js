const express = require("express");
const {
  createChapter,
  getChapterBySubject,
  getChapter,
} = require("../controller/chapter");
const upload = require("../middleware/multer");

router = express.Router();

router.post("/chapter", upload.single("image"), createChapter);
router.get("/chapter/:id", getChapter);
router.get("/chapters/:id", getChapterBySubject);

module.exports = router;
