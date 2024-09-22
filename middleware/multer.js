const multer = require("multer");
const uploadToCloud = require("../Cloudinary/uploadToCloud");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
    req.body.pdf = uploadToCloud(req.file.path);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });
module.exports = upload;
