const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  userPrompt: { type: String, required: true },
  result: { type: mongoose.Schema.Types.Mixed, required: true },
  confidence: { type: Number },
  needsReview: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Analysis', analysisSchema);
