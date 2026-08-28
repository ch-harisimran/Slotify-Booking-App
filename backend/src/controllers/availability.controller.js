const { getOpenSlotsForDate } = require('../lib/slots');

// GET /api/availability?service_id=&date=YYYY-MM-DD — open slots for a given day
async function getAvailability(req, res, next) {
  try {
    const { service_id, date } = req.query;

    if (!service_id || !date) {
      return res.status(400).json({ error: 'service_id and date are required' });
    }

    const result = await getOpenSlotsForDate(service_id, date);
    if (!result) {
      return res.status(404).json({ error: 'Service not found or date is invalid' });
    }

    res.json({ service_id, date, duration_minutes: result.duration_minutes, slots: result.slots });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAvailability };
