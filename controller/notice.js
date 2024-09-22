async function createNotice(req, res, next) {
  try {
    data = await Notice(req.body).save();
    res.status(200).send({ message: "Notice created successfully" });
  } catch (err) {
    next(err);
  }
}
async function getNotice(req, res, next) {
  try {
    data = await Notice.find();
    res.status(200).send(data);
  } catch (err) {
    next(err);
  }
}

async function getNoticeById(req, res, next) {
  const id = req.params.id;
  try {
    data = await Notice.findById(id);
    res.status(200).send(data);
  } catch (err) {
    next(err);
  }
}
module.exports = {
  createNotice,
  getNotice,
  getNoticeById,
};
