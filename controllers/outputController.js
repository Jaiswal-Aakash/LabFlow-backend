const path = require("path");
const fs = require("fs");
const Output = require("../models/Output");
const { getOwnedSession, getOwnedOutput } = require("../utils/ownership");
const normalizeTags = require("../utils/normalizeTags");

const buildImageUrl = (req, filename) =>
  `${req.protocol}://${req.get("host")}/uploads/${filename}`;

exports.listOutputsBySession = async (req, res) => {
  await getOwnedSession(req.params.sessionId, req.user._id);

  const outputs = await Output.find({
    user: req.user._id,
    session: req.params.sessionId,
  })
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean();

  res.json(outputs);
};

exports.createOutputs = async (req, res) => {
  const session = await getOwnedSession(req.params.sessionId, req.user._id);

  if (!req.files?.length) {
    return res.status(400).json({ message: "At least one image is required" });
  }

  const sharedTags = normalizeTags(req.body.tags);
  const sharedNote = req.body.note?.trim() || "";
  const sharedCode = req.body.code || "";
  const sharedCodeLanguage = req.body.codeLanguage?.trim() || "javascript";
  const baseTitle = req.body.title?.trim() || "";

  const existingCount = await Output.countDocuments({
    user: req.user._id,
    session: session._id,
  });

  const outputs = await Promise.all(
    req.files.map(async (file, index) => {
      const title =
        req.body.titles?.[index]?.trim() ||
        (baseTitle ? `${baseTitle} ${index + 1}` : file.originalname);

      return Output.create({
        user: req.user._id,
        subject: session.subject,
        session: session._id,
        title,
        imageUrl: buildImageUrl(req, file.filename),
        imageFilename: file.filename,
        note: sharedNote,
        code: sharedCode,
        codeLanguage: sharedCodeLanguage,
        tags: sharedTags,
        sortOrder: existingCount + index,
      });
    }),
  );

  res.status(201).json(outputs);
};

exports.getOutput = async (req, res) => {
  const output = await getOwnedOutput(req.params.outputId, req.user._id);
  res.json(output);
};

exports.updateOutput = async (req, res) => {
  const output = await getOwnedOutput(req.params.outputId, req.user._id);

  if (req.body.title !== undefined) output.title = String(req.body.title).trim();
  if (req.body.note !== undefined) output.note = String(req.body.note).trim();
  if (req.body.code !== undefined) output.code = req.body.code;
  if (req.body.codeLanguage !== undefined) {
    output.codeLanguage = String(req.body.codeLanguage).trim() || "javascript";
  }
  if (req.body.tags !== undefined) output.tags = normalizeTags(req.body.tags);
  if (req.body.sortOrder !== undefined) {
    output.sortOrder = Number(req.body.sortOrder);
  }

  await output.save();
  res.json(output);
};

exports.deleteOutput = async (req, res) => {
  const output = await getOwnedOutput(req.params.outputId, req.user._id);

  const filePath = path.join(__dirname, "..", "uploads", output.imageFilename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  await output.deleteOne();
  res.json({ message: "Output deleted" });
};
