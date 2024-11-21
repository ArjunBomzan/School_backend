const express = require("express");
const { search } = require("../controller/search");

router = express.Router();

router.get("/search", search);
module.exports = router;
