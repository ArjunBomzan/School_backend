require("./config/database");
require("dotenv").config();
const cors = require("cors");
const PORT = process.env.PORT;
const { handleServererro, resourceNotfound } = require("./middleware/error");
const express = require("express");
const router = require("./routes/auth");
const semesterrouter = require("./routes/semester");
const subject = require("./routes/subject");
const chapter = require("./routes/chapter");
const notice = require("./routes/notice");
const app = express();

app.get("/", (req, res) => {
  res.send("Your Server is alive");
});
app.use(express.json({ limit: "50mb" }));
app.use(cors());
app.use("/api/", router);
app.use("/api/", semesterrouter);
app.use("/api/", subject);
app.use("/api/", chapter);
app.use("/api/", notice);

app.use(resourceNotfound);
app.use(handleServererro);
app.listen(PORT, () => {
  console.log(`The School server is Listening to Port ${PORT}`);
});
