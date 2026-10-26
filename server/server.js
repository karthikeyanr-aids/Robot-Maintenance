const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Request logger for development
app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'ROBOCARE Predictive Maintenance API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/robots', require('./routes/robotRoutes'));
app.use('/api/components', require('./routes/componentRoutes'));
app.use('/api/errors', require('./routes/errorRoutes'));
app.use('/api/maintenance', require('./routes/maintenanceRoutes'));
app.use('/api/predictions', require('./routes/predictionRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} not found`,
  });
});

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  ROBOCARE Backend Server running on port ${PORT}`);
  console.log(`  Health endpoint: http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});
