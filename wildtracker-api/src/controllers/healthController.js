const { getKafkaHealth } = require('../services/kafkaService');
const logger = require('../utils/logger');

class HealthController {
  // Basic health check
  async getHealth(req, res) {
    try {
      const kafkaHealth = await getKafkaHealth();
      
      const healthStatus = {
        status: kafkaHealth.status === 'connected' ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
        services: {
          api: 'healthy',
          kafka: kafkaHealth.status
        },
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
        }
      };

      const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
      
      res.status(statusCode).json(healthStatus);
    } catch (error) {
      logger.error('Health check failed:', error);
      
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        message: error.message
      });
    }
  }

  // Detailed health check
  async getDetailedHealth(req, res) {
    try {
      const startTime = Date.now();
      const kafkaHealth = await getKafkaHealth();
      const kafkaResponseTime = Date.now() - startTime;

      const detailedHealth = {
        status: kafkaHealth.status === 'connected' ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        services: {
          api: {
            status: 'healthy',
            responseTime: 0
          },
          kafka: {
            status: kafkaHealth.status,
            responseTime: kafkaResponseTime,
            message: kafkaHealth.message,
            topics: kafkaHealth.topics
          }
        },
        system: {
          memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
            external: Math.round(process.memoryUsage().external / 1024 / 1024)
          },
          cpu: process.cpuUsage(),
          platform: process.platform,
          nodeVersion: process.version
        },
        configuration: {
          port: process.env.PORT || 3000,
          kafkaBrokers: process.env.KAFKA_BROKERS,
          kafkaTopic: process.env.KAFKA_TOPIC_TELEMETRY,
          logLevel: process.env.LOG_LEVEL
        }
      };

      const statusCode = detailedHealth.status === 'healthy' ? 200 : 503;
      
      res.status(statusCode).json(detailedHealth);
    } catch (error) {
      logger.error('Detailed health check failed:', error);
      
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Detailed health check failed',
        message: error.message
      });
    }
  }

  // Readiness check (for Kubernetes)
  async getReadiness(req, res) {
    try {
      const kafkaHealth = await getKafkaHealth();
      
      if (kafkaHealth.status !== 'connected') {
        return res.status(503).json({
          status: 'not ready',
          timestamp: new Date().toISOString(),
          reason: 'Kafka not connected'
        });
      }

      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Readiness check failed:', error);
      
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        reason: error.message
      });
    }
  }

  // Liveness check (for Kubernetes)
  async getLiveness(req, res) {
    try {
      // Simple check to ensure the process is alive
      res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    } catch (error) {
      logger.error('Liveness check failed:', error);
      
      res.status(503).json({
        status: 'not alive',
        timestamp: new Date().toISOString(),
        reason: error.message
      });
    }
  }
}

module.exports = new HealthController(); 