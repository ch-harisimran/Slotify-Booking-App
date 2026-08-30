const { supabaseAdmin } = require('../config/supabaseClient');
const { isSlotFree } = require('./bookings.controller');
const { getOpenSlotsForDate } = require('../lib/slots');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

const DISCLAIMER = "This isn't a medical diagnosis — please see a doctor for anything serious or persistent.";

function buildSystemPrompt(doctorRoster) {
  const specialties = [...new Set(doctorRoster.map((d) => d.specialty))];
  const rosterText = doctorRoster
    .map((d) => `${d.name} — ${d.specialty}, ${d.experience_years} yrs experience, ${d.rating}★ (${d.reviews_count} reviews)`)
    .join('\n');

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const weekday = now.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });

  return [
    "You are Slotify's AI assistant, built into a doctor-booking app called Slotify.",
    `Today is ${weekday}, ${today}.`,
    '',
    'You must classify EVERY message you receive, no matter how short, informal, oddly phrased, misspelled, or unusual — never refuse, never say you can\'t understand, never ask the user to rephrase. If a message is genuinely ambiguous, make your best judgment call (defaulting to "greeting" for anything that isn\'t clearly a symptom/doctor/booking topic) and, if useful, ask one short clarifying question inside "reply" instead of failing to answer.',
    '',
    'First, classify the user\'s LATEST message into exactly one intent:',
    '- "greeting": small talk, any greeting no matter how short ("hi", "hey", "hello", "yo", "sup", "good morning"), thanks, farewells, or anything not related to symptoms/doctors/booking. Reply briefly and naturally like a normal assistant would — do NOT diagnose, do NOT recommend a doctor, do NOT mention symptoms.',
    '- "symptom": the user is describing an actual physical or mental health symptom, complaint, or medical concern — in ANY phrasing, including casual, ungrammatical, or indirect descriptions (e.g. "I am having shivering", "my tooth hurts so bad", "I am having a baby" meaning pregnancy, "feeling dizzy lately", "cant sleep at all"). Do not require precise medical terminology to recognize a symptom.',
    '- "which_doctor": the user is asking which doctor is best/most suitable for symptoms already discussed in this conversation.',
    '- "book": the user wants to book/schedule an appointment (e.g. "book this doctor for me", "book Dr. X", "schedule an appointment", "yes book it"), OR they are replying with a day/time because you (the assistant) just asked them for one.',
    '- "my_bookings": the user is asking about their OWN scheduled appointments (e.g. "which appointments do I have", "what\'s on my schedule", "do I have anything booked", "when is my next appointment"). This is a factual lookup, not a request to book something new.',
    '- "past_checkups": the user is asking about their OWN past symptom checks / health history with this app (e.g. "what have I been checked for before", "what did I tell you last time", "what\'s my checkup history"). Not a new symptom report.',
    '',
    `Real doctor roster on the app (only ever reference these — never invent a name; exact specialties, spelled EXACTLY like this: ${specialties.join(', ')}):`,
    rosterText,
    '',
    'Rules:',
    '- Only fill in affected_area / condition_guess / recommended_specialty / doctors-related fields when intent is "symptom", "which_doctor", or "book". Leave them null for "greeting", "my_bookings", and "past_checkups" — those two are answered from the app\'s own records, not from you, so just keep "reply" short and conversational (e.g. "Sure, let me check." / "One sec, pulling that up.") and let the fields stay null.',
    '- recommended_specialty MUST be copied EXACTLY (same spelling/case) from the specialty list above — never invent or paraphrase a specialty name.',
    '- Map the symptom to the MOST SPECIFIC matching specialty whenever one reasonably fits, rather than defaulting to a general one. Examples: toothache/gum/mouth pain → Dentist; pregnancy/period/women\'s health → Gynecologist; skin rash/acne/itching → Dermatologist; chest pain/palpitations/high blood pressure → Cardiologist; child/infant symptoms → Pediatric; eye pain/blurry vision → Ophthalmology; ear/nose/throat/sore throat/sinus → ENT; anxiety/depression/stress/sleep issues → Psychiatry; weight/diet concerns → Nutrition; joint/bone/back/muscle pain → Orthopedics; headache/dizziness/numbness/seizures → Neurologist; fever/chills/shivering/cold/flu/general unwellness with no clearer specialty fit → Consultation (general physician) as the sensible default, not a fallback of last resort.',
    '- For "which_doctor" or when symptoms were already discussed earlier in the conversation, pick the strongest roster match by specialty fit, rating, and experience for recommended_doctor_name.',
    '- For "book": figure out which roster doctor the user means from the conversation (an explicitly named doctor, or the most recently discussed/recommended one). Put their exact roster name in recommended_doctor_name, or null if it is genuinely unclear (then ask which doctor in your reply).',
    '- For "book": try to extract a requested appointment day and time from the CURRENT message only. requested_date must be YYYY-MM-DD (resolve relative terms like "tomorrow" or "Friday" using today\'s date above, always a date on or after today). requested_time must be 24h "HH:MM" (map vague times: morning=09:00, afternoon=14:00, evening=16:00). If the message does not contain a day or time, set both to null and ask for them in your reply instead of guessing.',
    '- Keep "reply" short, warm, and conversational (1-3 sentences). For "symptom", end by inviting them to search doctors or book an appointment with a related doctor. Never state a diagnosis as certain — always frame it as a possibility.',
    '',
    'Respond ONLY with minified JSON, no markdown fences, no commentary before or after — the entire response must be exactly one JSON object in this shape:',
    '{"intent": "greeting|symptom|which_doctor|book|my_bookings|past_checkups", "reply": "string", "affected_area": "string or null", "condition_guess": "string or null", "recommended_specialty": "exact specialty name or null", "recommended_doctor_name": "exact roster name or null", "requested_date": "YYYY-MM-DD or null", "requested_time": "HH:MM or null"}',
  ].join('\n');
}

function badResponseError() {
  const err = new Error("The AI assistant couldn't process that — try rephrasing.");
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

async function requestCompletion(messages) {
  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.APP_URL || 'http://localhost:4000',
      'X-Title': 'Slotify',
    },
    // json_object mode makes the model return pure JSON instead of
    // occasionally wrapping it in prose or markdown fences, which was the
    // root cause of intermittent "couldn't process" failures on otherwise
    // ordinary messages.
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

function parseAiContent(content) {
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    if (!parsed.reply || !parsed.intent) return null;
    return parsed;
  } catch {
    return null;
  }
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
      ? history.slice(-10).map((h) => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.text }))
      : []),
    { role: 'user', content: message },
  ];

  // The model occasionally returns malformed JSON on a given call even in
  // json_object mode — retry once with a firmer reminder before surfacing
  // an error to the user, since a second attempt reliably succeeds.
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
    const parsed = parseAiContent(content);
    if (parsed) return parsed;
  }

  throw badResponseError();
}

function doctorsForSpecialty(roster, specialty, preferredName) {
  const norm = (s) => (s || '').trim().toLowerCase();

  let matches = roster.filter((d) => norm(d.specialty) === norm(specialty));

  // The model is instructed to copy the specialty name exactly, but as a
  // safety net against a slight paraphrase, try a loose match before
  // giving up on specialty relevance entirely.
  if (matches.length === 0 && specialty) {
    matches = roster.filter(
      (d) => norm(d.specialty).includes(norm(specialty)) || norm(specialty).includes(norm(d.specialty))
    );
  }

  // Falling all the way back to "top-rated across the whole roster" here
  // used to mean an unmatched specialty always surfaced the same one or two
  // highest-rated doctors regardless of symptom. Prefer the general
  // Consultation bucket instead, since that's the actual "not sure which
  // specialist" case — only fall back further if there's no Consultation
  // doctor on the roster at all.
  if (matches.length === 0) matches = roster.filter((d) => norm(d.specialty) === 'consultation');
  if (matches.length === 0) matches = roster.slice(0, 3);

  if (preferredName) {
    matches = [...matches].sort((a, b) => {
      const aMatch = a.name === preferredName ? -1 : 0;
      const bMatch = b.name === preferredName ? -1 : 0;
      return aMatch - bMatch;
    });
  }
  return matches.slice(0, 3);
}

function resolveDoctorByName(roster, name) {
  if (!name) return null;
  const lower = name.toLowerCase();
  return (
    roster.find((d) => d.name.toLowerCase() === lower) ||
    roster.find((d) => d.name.toLowerCase().includes(lower) || lower.includes(d.name.toLowerCase())) ||
    null
  );
}

async function findNearestSlots(doctorId, fromDate, maxDays = 7, limit = 3) {
  const found = [];
  const cursor = new Date(`${fromDate}T00:00:00.000Z`);
  for (let i = 0; i < maxDays && found.length < limit; i += 1) {
    const dateStr = cursor.toISOString().slice(0, 10);
    const result = await getOpenSlotsForDate(doctorId, dateStr);
    if (result) {
      for (const slot of result.slots) {
        if (found.length >= limit) break;
        found.push(slot);
      }
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return found;
}

// --- book: resolve doctor + day/time and actually create the booking ---
async function buildBookingResponse({ parsed, roster, req }) {
  const doctor = resolveDoctorByName(roster, parsed.recommended_doctor_name);

  if (!doctor) {
    return {
      intent: 'book',
      reply: parsed.reply || 'Which doctor would you like to book with?',
      doctors: roster.slice(0, 3),
    };
  }

  if (!parsed.requested_date || !parsed.requested_time) {
    return { intent: 'book', reply: parsed.reply, doctor };
  }

  if (!req.user) {
    return {
      intent: 'auth_required',
      reply: `Sign in and I'll lock in that appointment with ${doctor.name} for you.`,
      doctor,
    };
  }

  const startTime = new Date(`${parsed.requested_date}T${parsed.requested_time}:00.000Z`);
  if (Number.isNaN(startTime.getTime())) throw badResponseError();

  if (startTime.getTime() <= Date.now()) {
    return {
      intent: 'book',
      reply: `${parsed.requested_date} at ${parsed.requested_time} has already passed — what's a future day and time you'd like with ${doctor.name}?`,
      doctor,
    };
  }

  const daySlots = await getOpenSlotsForDate(doctor.id, parsed.requested_date);
  const exactSlot = daySlots?.slots.find((s) => s.start_time === startTime.toISOString());

  const free = exactSlot
    ? await isSlotFree({ service_id: doctor.id, start_time: exactSlot.start_time, end_time: exactSlot.end_time })
    : false;

  if (!exactSlot || !free) {
    const nearestSlots = await findNearestSlots(doctor.id, parsed.requested_date);
    return {
      intent: 'booking_unavailable',
      reply: `That exact time isn't open with ${doctor.name}. Here are the closest available slots — want one of these?`,
      doctor,
      nearest_slots: nearestSlots,
    };
  }

  const { data: booking, error: bookingError } = await supabaseAdmin
    .from('bookings')
    .insert({
      user_id: req.user.id,
      service_id: doctor.id,
      start_time: exactSlot.start_time,
      end_time: exactSlot.end_time,
      status: 'confirmed',
    })
    .select()
    .single();
  if (bookingError) throw bookingError;

  return {
    intent: 'booking_confirmed',
    reply: `Booked! You're set with ${doctor.name} on ${new Date(exactSlot.start_time).toLocaleString([], {
      weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    })}.`,
    doctor,
    booking,
  };
}

// --- my_bookings: answer "which appointments do I have" from real DB rows,
// never from the model's own (nonexistent) knowledge of the user's account ---
async function buildMyBookingsResponse(user) {
  if (!user) {
    return { intent: 'auth_required', reply: "Sign in and I'll pull up your appointments." };
  }

  const { data: userBookings, error } = await supabaseAdmin
    .from('bookings')
    .select('id, start_time, end_time, status, services(id, name, specialty, photo_url)')
    .eq('user_id', user.id)
    .neq('status', 'cancelled')
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true });
  if (error) throw error;

  if (!userBookings || userBookings.length === 0) {
    return {
      intent: 'my_bookings',
      reply: "You don't have any upcoming appointments booked right now. Want me to help you find a doctor?",
      bookings: [],
    };
  }

  const summary = userBookings
    .map(
      (b) =>
        `${b.services?.name} on ${new Date(b.start_time).toLocaleString([], {
          weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
        })}`
    )
    .join('; ');

  return {
    intent: 'my_bookings',
    reply: `You have ${userBookings.length} upcoming appointment${userBookings.length > 1 ? 's' : ''}: ${summary}.`,
    bookings: userBookings,
  };
}

// --- past_checkups: answer "what have I been checked for before" from the
// user's own symptom_check_logs rows, never fabricated ---
async function buildPastCheckupsResponse(user) {
  if (!user) {
    return { intent: 'auth_required', reply: "Sign in and I'll pull up your past checkups." };
  }

  const { data: logs, error } = await supabaseAdmin
    .from('symptom_check_logs')
    .select('user_message, ai_response, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30);
  if (error) throw error;

  const checkups = (logs || [])
    .filter((l) => l.ai_response?.intent === 'symptom' && l.ai_response?.affected_area)
    .slice(0, 8)
    .map((l) => ({
      date: l.created_at,
      message: l.user_message,
      affected_area: l.ai_response.affected_area,
      condition_guess: l.ai_response.condition_guess,
      recommended_specialty: l.ai_response.recommended_specialty,
    }));

  if (checkups.length === 0) {
    return {
      intent: 'past_checkups',
      reply: "I don't have any past symptom checks on file for you yet — describe how you're feeling any time and I'll take a look.",
      checkups: [],
    };
  }

  const summary = checkups
    .map((c) => `${new Date(c.date).toLocaleDateString([], { month: 'short', day: 'numeric' })} — ${c.affected_area}`)
    .join('; ');

  return {
    intent: 'past_checkups',
    reply: `Here's what you've checked in about before: ${summary}.`,
    checkups,
  };
}

// POST /api/ai/chat — body: { message, history? } — works signed-in or signed-out
async function chat(req, res, next) {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' });
    }

    const roster = await fetchDoctorRoster();
    const parsed = await callOpenRouter(message, history, roster);

    let responsePayload;

    if (parsed.intent === 'greeting') {
      responsePayload = { intent: 'greeting', reply: parsed.reply };
    } else if (parsed.intent === 'symptom' || parsed.intent === 'which_doctor') {
      const doctors = doctorsForSpecialty(roster, parsed.recommended_specialty, parsed.recommended_doctor_name);
      responsePayload = {
        intent: parsed.intent,
        reply: parsed.reply,
        affected_area: parsed.affected_area,
        condition_guess: parsed.condition_guess,
        recommended_specialty: parsed.recommended_specialty,
        disclaimer: DISCLAIMER,
        doctors,
      };
    } else if (parsed.intent === 'my_bookings') {
      responsePayload = await buildMyBookingsResponse(req.user);
    } else if (parsed.intent === 'past_checkups') {
      responsePayload = await buildPastCheckupsResponse(req.user);
    } else if (parsed.intent === 'book') {
      responsePayload = await buildBookingResponse({ parsed, roster, req });
    } else {
      // --- unrecognized intent value from the model — treat as small talk ---
      responsePayload = { intent: 'greeting', reply: parsed.reply };
    }

    // Log the ACTUAL final response (not just the raw classifier output) so
    // that GET /api/ai/history — which rebuilds the chat thread from these
    // rows — reflects exactly what the user saw, including booking
    // confirmations, doctor cards, and appointment/checkup lookups.
    await supabaseAdmin.from('symptom_check_logs').insert({
      user_id: req.user?.id || null,
      user_message: message,
      ai_response: responsePayload,
    });

    return res.json(responsePayload);
  } catch (err) {
    next(err);
  }
}

// GET /api/ai/history — auth required. Rebuilds the persisted chat thread
// from symptom_check_logs (every /chat turn is logged there) so the AI
// screen can pick up where the user left off instead of resetting to the
// greeting every time it's reopened.
async function getHistory(req, res, next) {
  try {
    const { data: logs, error } = await supabaseAdmin
      .from('symptom_check_logs')
      .select('user_message, ai_response, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: true })
      .limit(40);
    if (error) throw error;

    const messages = [];
    for (const log of logs || []) {
      messages.push({ role: 'user', text: log.user_message, created_at: log.created_at });
      if (log.ai_response) {
        messages.push({
          role: 'assistant',
          ...log.ai_response,
          text: log.ai_response.reply,
          created_at: log.created_at,
        });
      }
    }

    res.json({ messages });
  } catch (err) {
    next(err);
  }
}

module.exports = { chat, getHistory };
