const express = require("express");
const {
  createChapter,
  getChapterBySubject,
  getChapter,
  deleteChapter,
} = require("../controller/chapter");
const upload = require("../middleware/multer");
const { isadmin, isteacher } = require("../middleware/auth");

router = express.Router();

router.post("/chapter", upload.single("pdf"), createChapter);
router.get("/chapter/:id", getChapter);
router.delete("/chapter/:id", isadmin || isteacher, deleteChapter);
router.put("/chapter/:id", upload.single("image"), createChapter);
router.get("/chapters/:id", getChapterBySubject);

module.exports = router;
