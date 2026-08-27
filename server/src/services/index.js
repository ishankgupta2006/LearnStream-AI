const youtubeService = require('./youtubeService');
const transcriptionService = require('./transcriptionService');
const aiService = require('./aiService');
const videoProcessor = require('./videoProcessor');

module.exports = {
  ...youtubeService,
  ...transcriptionService,
  ...aiService,
  ...videoProcessor
};
