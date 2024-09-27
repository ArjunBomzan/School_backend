const express = require("express");
const upload = require("../middleware/multer");
const planStudy = require("../controller/pan-study");

router = express.Router();

// router.get("",get)
router.post("/plan-study", planStudy);
// router.get("/semester/:id");

module.exports = router;
