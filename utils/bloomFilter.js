const {BloomFilter} = require("bloom-filters");

const filter = new BloomFilter(1000, 0.01);

module.exports = filter;
