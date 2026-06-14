const Subject = require("../models/Subject");
const LabSession = require("../models/LabSession");
const Output = require("../models/Output");
const { getOwnedSubject } = require("../utils/ownership");
const { deleteStoredImages } = require("../services/imageStorage");

exports.listSubjects = async (req, res) => {
  const subjects = await Subject.find({ user: req.user._id })
    .sort({ name: 1 })
    .lean();

  const sessionCounts = await LabSession.aggregate([
    { $match: { user: req.user._id } },
    { $group: { _id: "$subject", count: { $sum: 1 } } },
  ]);

  const countMap = Object.fromEntries(
    sessionCounts.map((s) => [String(s._id), s.count]),
  );

  res.json(
    subjects.map((s) => ({
      ...s,
      sessionCount: countMap[String(s._id)] || 0,
    })),
  );
};

exports.createSubject = async (req, res) => {
  const { name, description } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ message: "Subject name is required" });
  }

  try {
    const subject = await Subject.create({
      user: req.user._id,
      name: name.trim(),
      description: description?.trim() || "",
    });

    res.status(201).json(subject);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Subject already exists" });
    }
    throw error;
  }
};

exports.getSubject = async (req, res) => {
  const subject = await getOwnedSubject(req.params.subjectId, req.user._id);
  const sessionCount = await LabSession.countDocuments({
    user: req.user._id,
    subject: subject._id,
  });

  res.json({ ...subject, sessionCount });
};

exports.updateSubject = async (req, res) => {
  const subject = await Subject.findOne({
    _id: req.params.subjectId,
    user: req.user._id,
  });

  if (!subject) {
    return res.status(404).json({ message: "Subject not found" });
  }

  if (req.body.name?.trim()) subject.name = req.body.name.trim();
  if (req.body.description !== undefined) {
    subject.description = String(req.body.description).trim();
  }

  await subject.save();
  res.json(subject);
};

exports.deleteSubject = async (req, res) => {
  const subject = await Subject.findOneAndDelete({
    _id: req.params.subjectId,
    user: req.user._id,
  });

  if (!subject) {
    return res.status(404).json({ message: "Subject not found" });
  }

  const sessions = await LabSession.find({
    user: req.user._id,
    subject: subject._id,
  }).select("_id");

  const sessionIds = sessions.map((s) => s._id);

  const outputs = await Output.find({
    user: req.user._id,
    subject: subject._id,
  }).lean();

  await deleteStoredImages(outputs);
  await Output.deleteMany({ user: req.user._id, subject: subject._id });
  await LabSession.deleteMany({ user: req.user._id, subject: subject._id });

  res.json({ message: "Subject deleted", sessionIds });
};
