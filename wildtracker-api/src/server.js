const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const logger = require('./utils/logger');
const { connectKafka } = require('./services/kafkaService');
const telemetryRoutes = require('./routes/telemetry');
const healthRoutes = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Routes
app.use('/api/v1/telemetry', telemetryRoutes);
app.use('/health', healthRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'WildTrack Telemetry API',
    version: '1.0.0',
    endpoints: {
      telemetry: '/api/v1/telemetry',
      health: '/health'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
async function startServer() {
  try {
    // Connect to Kafka (optional for local development)
    if (process.env.KAFKA_BROKERS && process.env.KAFKA_BROKERS.trim()) {
      try {
        await connectKafka();
        logger.info('Successfully connected to Kafka');
      } catch (kafkaError) {
        logger.warn('Failed to connect to Kafka, continuing without Kafka support:', kafkaError.message);
        logger.info('API will run in mock mode - telemetry data will not be persisted');
      }
    } else {
      logger.info('No Kafka brokers configured, running in mock mode');
    }
    
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info(`CORS Origin: ${process.env.CORS_ORIGIN || '*'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer(); 