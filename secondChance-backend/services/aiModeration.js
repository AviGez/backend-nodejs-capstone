const OpenAI = require('openai');
const logger = require('../logger');

let openaiClient = null;
if (process.env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
} else {
    logger.warn('OPENAI_API_KEY is not set; moderation will always allow content.');
}

const buildModerationPrompt = (text) => `
You are a content moderation assistant for a second-hand marketplace app with chat and item listings.

Decide if the following text is allowed or not under these rules:
- Disallow hate, explicit sexual content, strong threats, scams, or obvious spam.
- Disallow direct harassment and severe bullying.
- Mild frustration or informal language is allowed.

Return ONLY a JSON object with:
- "allowed": true or false
- "reasons": an array of short English strings

Text:
"${text}"
`.trim();

async function moderateText(text) {
    if (!text || !text.toString().trim()) {
        return { allowed: true, reasons: [] };
    }
    if (!openaiClient) {
        return { allowed: true, reasons: [] };
    }
    try {
        const response = await openaiClient.responses.create({
            model: 'gpt-4.1-mini',
            input: buildModerationPrompt(text),
            response_format: { type: 'json_object' },
        });
        const raw = response?.output?.[0]?.content?.[0]?.text;
        if (!raw) {
            return { allowed: true, reasons: ['moderation_no_response'] };
        }
        let parsed;
        try {
            parsed = JSON.parse(raw);
        } catch (err) {
            logger.error('Failed to parse moderation response', err);
            return { allowed: true, reasons: ['moderation_parse_error'] };
        }
        return {
            allowed: !!parsed.allowed,
            reasons: Array.isArray(parsed.reasons) ? parsed.reasons : [],
        };
    } catch (error) {
        logger.error('Moderation API failed', error);
        return { allowed: true, reasons: ['moderation_service_unavailable'] };
    }
}

module.exports = {
    moderateText,
};

