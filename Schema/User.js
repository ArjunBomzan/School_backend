const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const UserSchema = new Schema({
    name: {
        type: String,
        required: true, 
    },
    email: {
        type: String,
        required: true,
        validate: {
            validator: async function (req_value) {
                let count = await mongoose.models.User.countDocuments({ email: req_value })

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
    role: {
        required: true,
        type: String,
        enum: ["admin", "teacher"],
        set: function (value) {
            return value.toLowerCase();
        }
    }
}, {
    timestamps: true,
});

module.exports = mongoose.model("User", UserSchema)

