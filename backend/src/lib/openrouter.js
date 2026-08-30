const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

/** A 422 the route handlers can surface directly to the client. */
function badResponseError(message) {
  const err = new Error(message || "The AI assistant couldn't process that — try rephrasing.");
  err.status = 422;
  return err;
}

async function requestCompletion(messages) {
  if (!process.env.OPENROUTER_API_KEY) {
    const err = new Error('OPENROUTER_API_KEY is not set on the server');
    err.status = 500;
    throw err;
  }

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.APP_URL || 'http://localhost:4000',
      'X-Title': 'Slotify',
    },
    // json_object mode keeps the model from occasionally wrapping the answer
    // in prose/markdown, which used to intermittently break parsing.
    body: JSON.stringify({ model: MODEL, messages, response_format: { type: 'json_object' } }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    const err = new Error(`OpenRouter request failed (${response.status}): ${text.slice(0, 200)}`);
    err.status = 502;
    throw err;
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || '';
}

function extractJson(content) {
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

/**
 * Sends `messages` to OpenRouter and parses the reply as JSON, retrying once
 * with a firmer reminder if the model returns malformed JSON or a
 * structurally-incomplete parse (per the optional `isValid` check). Shared
 * by the AI assistant and AI reschedule controllers, which previously each
 * hand-rolled an identical version of this fetch/retry/parse loop.
 */
async function chatJson(messages, { isValid = () => true, errorMessage } = {}) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const attemptMessages =
      attempt === 0
        ? messages
        : [
            ...messages,
            {
              role: 'system',
              content:
                'Your previous reply was not valid JSON. Respond again with ONLY a single valid JSON object in the exact required shape — no other text.',
            },
          ];
    const content = await requestCompletion(attemptMessages);
    const parsed = extractJson(content);
    if (parsed && isValid(parsed)) return parsed;
  }
  throw badResponseError(errorMessage);
}

module.exports = { chatJson, badResponseError, MODEL };
