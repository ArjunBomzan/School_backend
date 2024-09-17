const Joi = require("joi")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
require('dotenv').config()
const User = require("../Schema/User")

// const get = (req, res) => {
//     res.send("got data")
// }


const schema = Joi.object({
    name: Joi.string().required(),
    password: Joi.string().required().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')),
    // password_confirmation: bJoi.required().ref('password'),
    email: Joi.string().email().required()
})
const signup = async (req, res, next) => {
    
    try {
        let { error } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: false,
            allowUnknown: true,
        })
        if (error?.details) {
            res.status(400).send({
                errors: error.details
            })
            return
        }
        let hashed = await bcrypt.hash(req.body.password, 10);
        let user = await User.create({ ...req.body, password: hashed })
        if (user) {

            user = user.toObject()
            delete user.password
          
            res.send(user)
        }
    } catch (err) {
      
        next(err)
    }
}



const LoginSchema = Joi.object({
    // name: Joi.string().required(),
    password: Joi.string().required().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')),
    // password_confirmation: bJoi.required().ref('password'),
    email: Joi.string().email().required()
})
const login = async (req, res, next) => {


    try {
        let { error } = LoginSchema.validate(req.body, {
            abortEarly: false,
            allowUnknown: true,
        })
        
        if (error?.details) {
            res.status(400).send({
                errors: error.details
            })
            return
        }
        let user = await User.findOne({ email: req.body.email }).select("+password")

        if (user) {

            let matched = await bcrypt.compare(req.body.password, user.password);
            

            user = user.toObject()
            delete user.password
            if (matched) {


                let token = jwt.sign(user, process.env.JWT_SECRET);
                console.log(token)

                res.send({
                    token,
                    mes: "user loged in"
                })
                return;
            }else{
                res.status(401).send("invalid credentials")
            }

            return
        }
        else {
            res.status(401).send("invalid credentials")
        }
    } catch (err) {
        next(err)
    }

}

module.exports = {

    signup,
    login
}