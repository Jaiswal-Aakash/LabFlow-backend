const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  HeadingLevel,
  AlignmentType,
} = require("docx");
const { imageSize } = require("image-size");
const fetchImageBuffer = require("../utils/fetchImageBuffer");

const DOCX_IMAGE_TYPES = new Set(["jpg", "png", "gif", "bmp"]);

const toDocxImageType = (type) => {
  if (type === "jpeg") return "jpg";
  if (DOCX_IMAGE_TYPES.has(type)) return type;
  return "png";
};

const sortedBlocks = (blocks) =>
  [...blocks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

const formatSessionDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const IMAGE_WIDTHS = { small: 280, medium: 420, large: 520 };

const blockTitle = (block, output) =>
  String(block.customTitle ?? output?.title ?? "").trim();

const blockNote = (block, output) =>
  String(block.customNote ?? output?.note ?? "").trim();

const blockCode = (block, output) =>
  String(block.customCode ?? output?.code ?? "").trim();

const blockLang = (block, output) =>
  block.customCodeLanguage ?? output?.codeLanguage ?? "text";

const buildImageParagraph = async (output, block = {}) => {
  const buffer = await fetchImageBuffer(output.imageUrl, output.imageFilename);
  const dimensions = imageSize(buffer);
  const maxWidth = IMAGE_WIDTHS[block.imageSize] || IMAGE_WIDTHS.medium;
  const width = Math.min(dimensions.width || maxWidth, maxWidth);
  const height = Math.round(
    ((dimensions.height || width) / (dimensions.width || width)) * width,
  );

  const alignment =
    block.imageAlign === "left"
      ? AlignmentType.LEFT
      : AlignmentType.CENTER;

  return new Paragraph({
    alignment,
    children: [
      new ImageRun({
        data: buffer,
        type: toDocxImageType(dimensions.type),
        transformation: { width, height },
      }),
    ],
  });
};

const sessionHeading = (session) => {
  if (!session) return null;
  const dateLabel = session.sessionDate
    ? ` — ${formatSessionDate(session.sessionDate)}`
    : "";
  return new Paragraph({
    text: `${session.title || "Session"}${dateLabel}`,
    heading: HeadingLevel.HEADING_2,
  });
};

exports.buildReportDocx = async ({
  title,
  subjectTitle,
  blocks,
  outputsById,
  sessionsById = {},
}) => {
  const children = [
    new Paragraph({
      text: title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
    }),
  ];

  if (subjectTitle) {
    children.push(
      new Paragraph({
        text: subjectTitle,
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.CENTER,
      }),
    );
  }

  children.push(new Paragraph({ text: "" }));

  let lastSessionId = null;

  for (const block of sortedBlocks(blocks)) {
    const output = outputsById[String(block.outputId)];
    if (!output) continue;

    const outputSessionId = String(output.session);
    if (outputSessionId !== lastSessionId) {
      const sessionMeta = sessionsById[outputSessionId];
      const heading = sessionHeading(sessionMeta);
      if (heading) {
        if (lastSessionId !== null) {
          children.push(new Paragraph({ text: "" }));
        }
        children.push(heading);
      }
      lastSessionId = outputSessionId;
    }

    const titleText = blockTitle(block, output);
    if (block.includeTitle !== false && titleText) {
      children.push(
        new Paragraph({
          text: titleText,
          heading: HeadingLevel.HEADING_1,
        }),
      );
    }

    if (block.includeTags && output.tags?.length) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Tags: ${output.tags.join(", ")}`,
              italics: true,
              size: 20,
            }),
          ],
        }),
      );
    }

    if (block.includeImage !== false && output.imageUrl) {
      try {
        children.push(await buildImageParagraph(output, block));
      } catch (err) {
        console.error("Docx image embed failed:", err.message);
        children.push(new Paragraph({ text: "[Image could not be embedded]" }));
      }
    }

    const noteText = blockNote(block, output);
    if (block.includeNote !== false && noteText) {
      children.push(
        new Paragraph({
          text: "Description",
          heading: HeadingLevel.HEADING_3,
        }),
      );
      children.push(new Paragraph({ text: noteText }));
    }

    const codeText = blockCode(block, output);
    if (block.includeCode !== false && codeText) {
      children.push(
        new Paragraph({
          text: `Code (${blockLang(block, output)})`,
          heading: HeadingLevel.HEADING_3,
        }),
      );
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: codeText,
              font: "Courier New",
              size: 20,
            }),
          ],
        }),
      );
    }

    children.push(new Paragraph({ text: "" }));
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  return Packer.toBuffer(doc);
};

exports.sanitizeFilename = (name) =>
  String(name || "lab-report")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80) || "lab-report";
