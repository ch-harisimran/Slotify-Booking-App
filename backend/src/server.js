require('dotenv').config();
const express = require('express');
const cors = require('cors');

const servicesRoutes = require('./routes/services.routes');
const availabilityRoutes = require('./routes/availability.routes');
const bookingsRoutes = require('./routes/bookings.routes');
const adminRoutes = require('./routes/admin.routes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/services', servicesRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/admin', adminRoutes);

// AI reschedule lives at POST /api/bookings/:id/reschedule-ai (see bookings.routes.js)

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Slotify API listening on port ${PORT}`);
});
