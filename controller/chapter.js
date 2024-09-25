// const uploadToCloud = require("../Cloudinary/uploadToCloud");
const Chapter = require("../Schema/Chapter");
async function createChapter(req, res, next) {
  // console.log("file", req.body.pdf);
  // if (req.body.pdf.file) {
  //   const url = await uploadToCloud(req.body.pdf.file.url);
  //   console.log("url", url);
  //   req.body.pdf = url;
  // }

  try {
    data = await Chapter(req.body).save();
    res.status(200).send({ message: "Chapter created successfully" });
  } catch (err) {
    next(err);
  }
}
async function getChapterBySubject(req, res, next) {
  const subjectId = req.params.id;
  try {
    data = await Chapter.find({ subjectId: subjectId });
    res.status(200).send(data);
  } catch (err) {
    next(err);
  }
}
async function getChapter(req, res, next) {
  const Id = req.params.id;
  try {
    data = await Chapter.findById(Id);
    res.status(200).send(data);
  } catch (err) {
    next(err);
  }
}
async function deleteChapter(req, res, next) {
  const id = req.params.id;
  try {
    data = await Chapter.findByIdAndDelete(id);
    res.status(200).send({ message: "Chapter deleted successfully" });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createChapter,
  getChapterBySubject,
  getChapter,
  deleteChapter,
};
