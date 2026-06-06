const normalizeTags = (tags) => {
  if (!tags) return [];

  const list = Array.isArray(tags)
    ? tags
    : String(tags)
        .split(",")
        .map((t) => t.trim());

  return [...new Set(list.map((t) => t.toLowerCase()).filter(Boolean))];
};

module.exports = normalizeTags;
