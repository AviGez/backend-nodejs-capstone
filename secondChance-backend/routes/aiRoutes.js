const express = require('express');
const OpenAI = require('openai');
const { moderateText } = require('../services/aiModeration');

const router = express.Router();

let openaiClient = null;
if (process.env.OPENAI_API_KEY) {
  openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

const buildPrompt = ({ title, category, details }) => `
You are helping a user write a clear, friendly description for an item in a second-hand gift marketplace.

Title: ${title || 'N/A'}
Category: ${category || 'N/A'}
Extra details from the user: ${details || 'N/A'}

Write a short, attractive description in simple language (3-5 sentences).
`.trim();

router.post('/describe-item', async (req, res, next) => {
  try {
    if (!openaiClient) {
      return res.status(503).json({ error: 'AI service not configured' });
    }
    const { title, category, details } = req.body || {};
    if (!title && !category && !details) {
      return res.status(400).json({ error: 'Missing input data' });
    }

    const prompt = buildPrompt({ title, category, details });
    const response = await openaiClient.responses.create({
      model: 'gpt-4.1-mini',
      input: prompt,
    });

    const description =
      response?.output?.[0]?.content?.[0]?.text?.trim?.() ||
      'Could not generate description.';

    res.json({ description });
  } catch (err) {
    console.error('AI describe-item error:', err);
    next(err);
  }
});

router.post('/moderate-text', async (req, res, next) => {
  try {
    const { text } = req.body || {};
    if (typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }
    const result = await moderateText(text);
    res.json(result);
  } catch (err) {
    console.error('AI moderate-text error:', err);
    next(err);
  }
});

module.exports = router;

