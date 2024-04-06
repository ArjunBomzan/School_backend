const jwt = require("jsonwebtoken");
const { ADMIN, TEACHER } = require("../Constants");
BUYER


const checkValidation = (req, res, next) => {

    let token = req.headers?.authorization.split(" ")[1]
    let user = null
    try {
        user = jwt.verify(token, process.env.JWT_SECRET);
        req.user = user
        next()
    }
    catch (err) {

    }


}


const isadmin = (req, res, next) => {


    let role = req.user.role
    req._id = req.user._id

   
    if (ADMIN === role) {
        next()
    } else {
        res.status(403).send("Forbiden")
    }


}



const isteacher = (req, res, next) => {
    let role = req.user.role
    req._id = req.user._id


    if (TEACHER === role) {
        next()
    } else {
        res.status(403).send("Forbiden")
    }

}
module.exports = {
    checkValidation,
    isadmin,isteacher
}