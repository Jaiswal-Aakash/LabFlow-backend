const LabSession = require("../models/LabSession");
const Output = require("../models/Output");
const { getOwnedSubject, getOwnedSession } = require("../utils/ownership");
const { deleteStoredImages } = require("../services/imageStorage");

exports.listSessionsBySubject = async (req, res) => {
  const subject = await getOwnedSubject(req.params.subjectId, req.user._id);

  const sessions = await LabSession.find({
    user: req.user._id,
    subject: subject._id,
  })
    .sort({ sessionDate: -1, createdAt: -1 })
    .lean();

  const outputCounts = await Output.aggregate([
    {
      $match: {
        user: req.user._id,
        subject: subject._id,
      },
    },
    { $group: { _id: "$session", count: { $sum: 1 } } },
  ]);

  const countMap = Object.fromEntries(
    outputCounts.map((o) => [String(o._id), o.count]),
  );

  res.json(
    sessions.map((s) => ({
      ...s,
      outputCount: countMap[String(s._id)] || 0,
    })),
  );
};

exports.createSession = async (req, res) => {
  const subject = await getOwnedSubject(req.params.subjectId, req.user._id);
  const { title, sessionDate } = req.body;

  if (!title?.trim()) {
    return res.status(400).json({ message: "Session title is required" });
  }

  if (!sessionDate) {
    return res.status(400).json({ message: "Session date is required" });
  }

  const session = await LabSession.create({
    user: req.user._id,
    subject: subject._id,
    title: title.trim(),
    sessionDate: new Date(sessionDate),
  });

  res.status(201).json(session);
};

exports.getSession = async (req, res) => {
  const session = await getOwnedSession(req.params.sessionId, req.user._id);
  const outputCount = await Output.countDocuments({
    user: req.user._id,
    session: session._id,
  });

  res.json({ ...session, outputCount });
};

exports.updateSession = async (req, res) => {
  const session = await LabSession.findOne({
    _id: req.params.sessionId,
    user: req.user._id,
  });

  if (!session) {
    return res.status(404).json({ message: "Session not found" });
  }

  if (req.body.title?.trim()) session.title = req.body.title.trim();
  if (req.body.sessionDate) session.sessionDate = new Date(req.body.sessionDate);

  await session.save();
  res.json(session);
};

exports.deleteSession = async (req, res) => {
  const session = await LabSession.findOneAndDelete({
    _id: req.params.sessionId,
    user: req.user._id,
  });

  if (!session) {
    return res.status(404).json({ message: "Session not found" });
  }

  const outputs = await Output.find({
    user: req.user._id,
    session: session._id,
  }).lean();

  await deleteStoredImages(outputs);
  await Output.deleteMany({ user: req.user._id, session: session._id });

  res.json({ message: "Session deleted" });
};
