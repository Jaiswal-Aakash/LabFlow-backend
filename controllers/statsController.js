const User = require("../models/User");
const LabSession = require("../models/LabSession");
const Output = require("../models/Output");

exports.getPublicStats = async (req, res) => {
  const [userCount, outputCount, sessionCount] = await Promise.all([
    User.countDocuments(),
    Output.countDocuments(),
    LabSession.countDocuments(),
  ]);

  res.set("Cache-Control", "public, max-age=60");
  res.json({ userCount, outputCount, sessionCount });
};
