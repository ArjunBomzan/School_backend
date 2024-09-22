const express = require("express");
const upload = require("../middleware/multer");
const {
  getNotice,
  createNotice,
  getNoticeById,
} = require("../controller/notice");

router = express.Router();

// router.get("",get)
router.post("/notice", upload.single("pdf"), createNotice);
// router.get("/semester/:id");
router.get("/notices", getNotice);
router.get("/notices/:id", getNoticeById);

module.exports = router;
