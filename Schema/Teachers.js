const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const TeacherSchema = new Schema({
    name: {
        type: String,
        required: true, 
    },
    email: {
        type: String,
        required: true,
        validate: {
            validator: async function (req_value) {
                let count = await mongoose.models.Teacher.countDocuments({ email: req_value })

                if (count) {
                    return false
                }
                return true;
            },
            message: "email alredy used.."
        }

        // unique: true,
    },
    password: {
        type: String,
        required: true,
        
    },
    
 
}, {
    timestamps: true,
});

module.exports = mongoose.model("Teacher", UserSchema)

