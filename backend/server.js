// tiffin-backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');

// Import routes
const authRoutes         = require('./routes/auth');
const userRoutes         = require('./routes/users');
const planRoutes         = require('./routes/plans');
const subscriptionRoutes = require('./routes/subscriptions');
const deliveryRoutes     = require('./routes/deliveries');
const feedbackRoutes     = require('./routes/feedback');
const ridersRoutes       = require('./routes/riders');
const riderLocationsRoutes = require('./routes/riderLocations');
const paymentsRoutes     = require('./routes/payments');
const logsRoutes         = require('./routes/logs');
const menuRoutes         = require('./routes/menu');
const menuAdminRoutes    = require('./routes/menuAdmin');
const menuUploadRoutes   = require('./routes/MenuUpload');
const weeklyMenuRoutes   = require('./routes/weeklyMenu');
const adminAnalyticsRoutes = require('./routes/adminAnalytics');
const dashboardRoutes    = require('./routes/dashboard');
const categoriesRoutes   = require('./routes/categories');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
            process.env.FRONTEND_URL
        ].filter(Boolean);

        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('CORS not allowed'));
        }
    },
    credentials: true
}));
app.use(express.json());

// Serve uploaded images as static files
app.use('/uploads', express.static(path.join(__dirname, 'Uploads')));

// ── Health / Root ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({
        message: 'Tiffin Delivery API is running!',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// ── API Routes ────────────────────────────────────────────────────────────────
// Menu upload must come before menuAdmin so /upload-image is matched first
app.use('/api/menu-admin', menuUploadRoutes);
app.use('/api/menu-admin', menuAdminRoutes);

app.use('/api', authRoutes);                       // POST /api/login, /api/register
app.use('/api/users', userRoutes);
app.use('/api/meal-plans', planRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/riders', ridersRoutes);
app.use('/api/rider-locations', riderLocationsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/menu', menuRoutes);                  // mounted ONCE
app.use('/api/weekly-menu', weeklyMenuRoutes);
app.use('/api/admin-analytics', adminAnalyticsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/categories', categoriesRoutes);

// ── Error handling ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
});

// 404 – must be last
app.use((req, res) => {
    res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.listen(PORT, () => {
    console.log(`✓ Server running on port ${PORT}`);
    console.log(`✓ Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});
