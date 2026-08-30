const { supabaseAdmin } = require('../config/supabaseClient');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

const DISCLAIMER =
  "This isn't a medical diagnosis — please see a doctor for anything serious or persistent.";

function buildSystemPrompt(doctorRoster) {
  const specialties = [...new Set(doctorRoster.map((d) => d.specialty))];
  const rosterText = doctorRoster
    .map((d) => `${d.name} — ${d.specialty}, ${d.experience_years} yrs experience, ${d.rating}★ (${d.reviews_count} reviews)`)
    .join('\n');

  return [
    "You are Slotify's AI health assistant, built into a doctor-booking app.",
    'A user will describe symptoms, or ask follow-up questions about a symptom conversation already in progress.',
    'Identify the likely affected body system/area and a plausible, non-diagnostic explanation of what might be going on.',
    `Recommend exactly one specialty from this exact list (match spelling exactly): ${specialties.join(', ')}.`,
    'Here is the current roster of real doctors on the app you can reference by name when asked things like "which doctor is best":',
    rosterText,
    'When asked which doctor is best for the symptoms discussed, pick the strongest match from the roster above by specialty fit, rating, and experience, and explain briefly why.',
    'Never invent a doctor name that is not in the roster.',
    'Respond ONLY with minified JSON, no markdown fences, in this exact shape:',
    '{"reply": "2-4 sentence conversational reply", "affected_area": "short phrase", "condition_guess": "short phrase, plausible but non-diagnostic", "recommended_specialty": "one of the exact specialty names above", "recommended_doctor_name": "exact roster name or null if not specifically asked"}',
    'Keep "reply" warm and conversational, avoid alarming language, and end it by inviting the user to search doctors or book an appointment with a related doctor.',
  ].join('\n');
}

function badResponseError() {
  const err = new Error("The AI assistant couldn't process that — try describing your symptoms differently.");
  err.status = 422;
  return err;
}

async function fetchDoctorRoster() {
  const { data, error } = await supabaseAdmin
    .from('services')
    .select('id, name, specialty, photo_url, rating, reviews_count, experience_years, price, duration_minutes')
    .order('rating', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function callOpenRouter(message, history, roster) {
  if (!process.env.OPENROUTER_API_KEY) {
    const err = new Error('OPENROUTER_API_KEY is not set on the server');
    err.status = 500;
    throw err;
  }

  const messages = [
    { role: 'system', content: buildSystemPrompt(roster) },
    ...(Array.isArray(history)
      ? history.slice(-8).map((h) => ({
          role: h.role === 'user' ? 'user' : 'assistant',
          content: h.text,
        }))
      : []),
    { role: 'user', content: message },
  ];

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.APP_URL || 'http://localhost:4000',
      'X-Title': 'Slotify',
    },
    body: JSON.stringify({ model: MODEL, messages }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    const err = new Error(`OpenRouter request failed (${response.status}): ${text.slice(0, 200)}`);
    err.status = 502;
    throw err;
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content || '';
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) throw badResponseError();

  let parsed;
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    throw badResponseError();
  }
  if (!parsed.reply || !parsed.recommended_specialty) throw badResponseError();

  return parsed;
}

// POST /api/ai/symptom-check — body: { message, history? } — works signed-in or signed-out
async function symptomCheck(req, res, next) {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' });
    }

    const roster = await fetchDoctorRoster();
    const parsed = await callOpenRouter(message, history, roster);

    // Trust our own DB over the model for which doctors to actually show —
    // filter the roster by the specialty the AI recommended.
    let matches = roster.filter(
      (d) => d.specialty?.toLowerCase() === parsed.recommended_specialty?.toLowerCase()
    );
    if (matches.length === 0) matches = roster.slice(0, 3);

    // If the AI named a specific doctor, put them first.
    if (parsed.recommended_doctor_name) {
      matches.sort((a, b) => {
        const aMatch = a.name === parsed.recommended_doctor_name ? -1 : 0;
        const bMatch = b.name === parsed.recommended_doctor_name ? -1 : 0;
        return aMatch - bMatch;
      });
    }

    const doctors = matches.slice(0, 3);

    await supabaseAdmin.from('symptom_check_logs').insert({
      user_id: req.user?.id || null,
      user_message: message,
      ai_response: { ...parsed, doctor_ids: doctors.map((d) => d.id) },
    });

    res.json({
      reply: parsed.reply,
      affected_area: parsed.affected_area,
      condition_guess: parsed.condition_guess,
      recommended_specialty: parsed.recommended_specialty,
      disclaimer: DISCLAIMER,
      doctors,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { symptomCheck };
