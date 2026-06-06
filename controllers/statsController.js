const User = require("../models/User");

exports.getPublicStats = async (req, res) => {
  const userCount = await User.countDocuments();

  res.set("Cache-Control", "public, max-age=60");
  res.json({ userCount });
};
