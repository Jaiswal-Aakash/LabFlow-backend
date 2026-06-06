const Subject = require("../models/Subject");
const LabSession = require("../models/LabSession");
const Output = require("../models/Output");

const httpError = (message, statusCode = 404) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

exports.getOwnedSubject = async (subjectId, userId) => {
  const subject = await Subject.findOne({ _id: subjectId, user: userId }).lean();
  if (!subject) throw httpError("Subject not found");
  return subject;
};

exports.getOwnedSession = async (sessionId, userId) => {
  const session = await LabSession.findOne({ _id: sessionId, user: userId }).lean();
  if (!session) throw httpError("Session not found");
  return session;
};

exports.getOwnedOutput = async (outputId, userId) => {
  const output = await Output.findOne({ _id: outputId, user: userId });
  if (!output) throw httpError("Output not found");
  return output;
};
