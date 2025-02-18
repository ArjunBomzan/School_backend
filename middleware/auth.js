const jwt = require("jsonwebtoken");
const { ADMIN, TEACHER, STUDENT } = require("../Constants");

const checkValidation = (req, res, next) => {
  let token = req.headers?.authorization.split(" ")[1];
  let user = null;
  try {
    user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

const isadmin = (req, res, next) => {
  let role = req.user.role;
  req._id = req.user._id;

  if (ADMIN === role) {
    next();
  } else {
    res.status(403).send("Forbiden");
  }
};

const isteacher = (req, res, next) => {
  let role = req.user.role;
  req._id = req.user._id;

  if (TEACHER === role) {
    next();
  } else {
    res.status(403).send("Forbiden");
  }
};
const isstudent = (req, res, next) => {
  let role = req.user.role;
  req._id = req.user._id;

  if (STUDENT === role) {
    next();
  } else {
    res.status(403).send("Forbiden");
  }
};

module.exports = {
  checkValidation,
  isadmin,
  isteacher,
  isstudent,
};
