const { classify } = require('../services/classifierService');

async function classifyText(req, res, next) {
  try {
    const { text } = req.body || {};

    if (typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required and must be a non-empty string.' });
    }

    if (text.length > 1000) {
      return res.status(400).json({ error: 'Text must be 1000 characters or fewer.' });
    }

    const result = await classify(text.trim());
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

module.exports = { classifyText };
