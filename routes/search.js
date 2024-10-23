const express = require("express");
const { search } = require("../controller/search");

router = express.Router();

// router.get("",get)
router.get("/search", search);

module.exports = router;
