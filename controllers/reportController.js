const LabReport = require("../models/LabReport");
const LabSession = require("../models/LabSession");
const Subject = require("../models/Subject");
const Output = require("../models/Output");
const { getOwnedSession, getOwnedSubject } = require("../utils/ownership");
const { buildReportDocx, sanitizeFilename } = require("../services/docxBuilder");

const getOwnedReport = async (reportId, userId) => {
  const report = await LabReport.findOne({ _id: reportId, user: userId });
  if (!report) {
    const error = new Error("Report not found");
    error.status = 404;
    throw error;
  }
  return report;
};

const loadOutputsForBlocks = async (userId, subjectId, blocks) => {
  const outputIds = blocks.map((b) => b.outputId);

  const outputs = await Output.find({
    _id: { $in: outputIds },
    user: userId,
    subject: subjectId,
  }).lean();

  if (outputs.length !== outputIds.length) {
    const error = new Error("Some outputs are invalid for this subject");
    error.status = 400;
    throw error;
  }

  return Object.fromEntries(outputs.map((o) => [String(o._id), o]));
};

const deriveSessionIds = (blocks, outputsById, existingSessions = []) => {
  const ids = new Set(existingSessions.map(String));

  blocks.forEach((block) => {
    const output = outputsById[String(block.outputId)];
    if (output?.session) ids.add(String(output.session));
  });

  return [...ids];
};

const loadSessionsMap = async (userId, sessionIds) => {
  if (!sessionIds.length) return {};

  const sessions = await LabSession.find({
    _id: { $in: sessionIds },
    user: userId,
  }).lean();

  return Object.fromEntries(sessions.map((s) => [String(s._id), s]));
};

const buildReportBuffer = async (report, userId) => {
  const outputsById = await loadOutputsForBlocks(
    userId,
    report.subject,
    report.blocks,
  );

  const sessionIds = deriveSessionIds(
    report.blocks,
    outputsById,
    report.sessions?.length ? report.sessions : report.session ? [report.session] : [],
  );

  const [sessionsById, subject] = await Promise.all([
    loadSessionsMap(userId, sessionIds),
    Subject.findOne({ _id: report.subject, user: userId }).lean(),
  ]);

  return buildReportDocx({
    title: report.title,
    subjectTitle: subject?.name,
    blocks: report.blocks,
    outputsById,
    sessionsById,
  });
};

const sendDocx = (res, buffer, title) => {
  const filename = `${sanitizeFilename(title)}.docx`;
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  );
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(buffer);
};

exports.listReportsBySubject = async (req, res) => {
  await getOwnedSubject(req.params.subjectId, req.user._id);

  const reports = await LabReport.find({
    user: req.user._id,
    subject: req.params.subjectId,
  })
    .sort({ updatedAt: -1 })
    .lean();

  res.json(reports);
};

exports.listReportsBySession = async (req, res) => {
  const session = await getOwnedSession(req.params.sessionId, req.user._id);

  const reports = await LabReport.find({
    user: req.user._id,
    subject: session.subject,
    $or: [{ session: session._id }, { sessions: session._id }],
  })
    .sort({ updatedAt: -1 })
    .lean();

  res.json(reports);
};

exports.createReportForSubject = async (req, res) => {
  const subject = await getOwnedSubject(req.params.subjectId, req.user._id);
  const { title, blocks } = req.body;

  if (!title?.trim()) {
    return res.status(400).json({ message: "Report title is required" });
  }

  let sessions = [];
  if (blocks?.length) {
    const outputsById = await loadOutputsForBlocks(
      req.user._id,
      subject._id,
      blocks,
    );
    sessions = deriveSessionIds(blocks, outputsById);
  }

  const report = await LabReport.create({
    user: req.user._id,
    subject: subject._id,
    session: sessions[0] || undefined,
    sessions,
    title: title.trim(),
    blocks: blocks || [],
  });

  res.status(201).json(report);
};

exports.createReport = async (req, res) => {
  const session = await getOwnedSession(req.params.sessionId, req.user._id);
  const { title, blocks } = req.body;

  if (!title?.trim()) {
    return res.status(400).json({ message: "Report title is required" });
  }

  let sessions = [session._id];
  if (blocks?.length) {
    const outputsById = await loadOutputsForBlocks(
      req.user._id,
      session.subject,
      blocks,
    );
    sessions = deriveSessionIds(blocks, outputsById, [session._id]);
  }

  const report = await LabReport.create({
    user: req.user._id,
    subject: session.subject,
    session: session._id,
    sessions,
    title: title.trim(),
    blocks: blocks || [],
  });

  res.status(201).json(report);
};

exports.exportReportDraftForSubject = async (req, res) => {
  const subject = await getOwnedSubject(req.params.subjectId, req.user._id);
  const { title, blocks } = req.body;

  if (!title?.trim()) {
    return res.status(400).json({ message: "Report title is required" });
  }

  if (!blocks?.length) {
    return res.status(400).json({ message: "Add at least one output to the document" });
  }

  const buffer = await buildReportBuffer(
    {
      title: title.trim(),
      subject: subject._id,
      blocks,
    },
    req.user._id,
  );

  sendDocx(res, buffer, title.trim());
};

exports.exportReportDraft = async (req, res) => {
  const session = await getOwnedSession(req.params.sessionId, req.user._id);
  const { title, blocks } = req.body;

  if (!title?.trim()) {
    return res.status(400).json({ message: "Report title is required" });
  }

  if (!blocks?.length) {
    return res.status(400).json({ message: "Add at least one output to the document" });
  }

  const buffer = await buildReportBuffer(
    {
      title: title.trim(),
      subject: session.subject,
      blocks,
    },
    req.user._id,
  );

  sendDocx(res, buffer, title.trim());
};

exports.getReport = async (req, res) => {
  const report = await getOwnedReport(req.params.reportId, req.user._id);
  res.json(report);
};

exports.updateReport = async (req, res) => {
  const report = await getOwnedReport(req.params.reportId, req.user._id);

  if (req.body.title !== undefined) {
    const nextTitle = String(req.body.title).trim();
    if (!nextTitle) {
      return res.status(400).json({ message: "Report title is required" });
    }
    report.title = nextTitle;
  }

  if (req.body.blocks !== undefined) {
    report.blocks = req.body.blocks;

    if (report.blocks.length) {
      const outputsById = await loadOutputsForBlocks(
        req.user._id,
        report.subject,
        report.blocks,
      );
      report.sessions = deriveSessionIds(report.blocks, outputsById);
      report.session = report.sessions[0] || report.session;
    }
  }

  await report.save();
  res.json(report);
};

exports.deleteReport = async (req, res) => {
  const report = await getOwnedReport(req.params.reportId, req.user._id);
  await report.deleteOne();
  res.json({ message: "Report deleted" });
};

exports.exportReport = async (req, res) => {
  const report = await getOwnedReport(req.params.reportId, req.user._id);

  if (!report.blocks?.length) {
    return res.status(400).json({ message: "Add at least one output to the document" });
  }

  const buffer = await buildReportBuffer(report, req.user._id);
  sendDocx(res, buffer, report.title);
};

exports.enableShare = async (req, res) => {
  const report = await getOwnedReport(req.params.reportId, req.user._id);

  if (!report.shareToken) {
    report.shareToken = LabReport.generateShareToken();
  }

  report.shareEnabled = true;
  await report.save();

  res.json({
    shareToken: report.shareToken,
    sharePath: `/shared/reports/${report.shareToken}`,
  });
};

exports.disableShare = async (req, res) => {
  const report = await getOwnedReport(req.params.reportId, req.user._id);
  report.shareEnabled = false;
  await report.save();
  res.json({ message: "Share link disabled" });
};

exports.getSharedReportMeta = async (req, res) => {
  const report = await LabReport.findOne({
    shareToken: req.params.shareToken,
    shareEnabled: true,
  }).lean();

  if (!report) {
    return res.status(404).json({ message: "Shared report not found" });
  }

  res.json({
    title: report.title,
    blockCount: report.blocks?.length || 0,
    sessionCount: report.sessions?.length || (report.session ? 1 : 0),
    updatedAt: report.updatedAt,
    downloadPath: `/api/shared/reports/${report.shareToken}/download`,
  });
};

exports.downloadSharedReport = async (req, res) => {
  const report = await LabReport.findOne({
    shareToken: req.params.shareToken,
    shareEnabled: true,
  });

  if (!report) {
    return res.status(404).json({ message: "Shared report not found" });
  }

  if (!report.blocks?.length) {
    return res.status(400).json({ message: "This report has no content" });
  }

  const buffer = await buildReportBuffer(report, report.user);
  sendDocx(res, buffer, report.title);
};
