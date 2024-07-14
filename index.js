require("./config/database");
require("dotenv").config();
const cors = require("cors");
const PORT = process.env.PORT;
const { handleServererro, resourceNotfound } = require("./middleware/error");
const router = require("./routes/auth");
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Your Server is alive");
});
app.use(express.json());
app.use(cors());
app.use("/api/", router);

app.use(resourceNotfound);
app.use(handleServererro);
app.listen(PORT, () => {
  console.log(`The School server is Listening to Port ${PORT}`);
});
