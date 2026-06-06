const Output = require("../models/Output");
const normalizeTags = require("../utils/normalizeTags");

exports.searchOutputs = async (req, res) => {
  const { tag, q, subjectId, sessionId } = req.query;
  const filter = { user: req.user._id };

  if (subjectId) filter.subject = subjectId;
  if (sessionId) filter.session = sessionId;

  if (tag) {
    const tags = normalizeTags(tag);
    if (tags.length === 1) {
      filter.tags = tags[0];
    } else if (tags.length > 1) {
      filter.tags = { $all: tags };
    }
  }

  let outputs;

  if (q?.trim()) {
    outputs = await Output.find(
      { ...filter, $text: { $search: q.trim() } },
      { score: { $meta: "textScore" } },
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(50)
      .lean();
  } else {
    outputs = await Output.find(filter)
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();
  }

  res.json(outputs);
};

exports.listTags = async (req, res) => {
  const tags = await Output.aggregate([
    { $match: { user: req.user._id } },
    { $unwind: "$tags" },
    { $group: { _id: "$tags", count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
    { $limit: 100 },
  ]);

  res.json(tags.map((t) => ({ tag: t._id, count: t.count })));
};
