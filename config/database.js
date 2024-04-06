require('dotenv').config()
const mongoose=require("mongoose")

mongoose.connect('mongodb+srv://SuperUser:Superpassword@school-v1.cclatve.mongodb.net/?retryWrites=true&w=majority&appName=school-v1/School_1')
  .then(() => console.log('Connected!'));
