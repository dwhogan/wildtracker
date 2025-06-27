const { Kafka } = require('kafkajs');
const logger = require('../utils/logger');

class KafkaService {
  constructor() {
    this.kafka = null;
    this.producer = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      const brokers = process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'];
      
      this.kafka = new Kafka({
        clientId: process.env.KAFKA_CLIENT_ID || 'wildtrack-telemetry-api',
        brokers: brokers,
        retry: {
          initialRetryTime: 100,
          retries: 8
        }
      });

      this.producer = this.kafka.producer();
      await this.producer.connect();
      
      this.isConnected = true;
      logger.info('Successfully connected to Kafka', {
        brokers: brokers,
        clientId: this.kafka.clientId
      });
    } catch (error) {
      logger.error('Failed to connect to Kafka:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.producer) {
        await this.producer.disconnect();
        this.isConnected = false;
        logger.info('Disconnected from Kafka');
      }
    } catch (error) {
      logger.error('Error disconnecting from Kafka:', error);
    }
  }

  async sendTelemetryMessage(telemetryData) {
    if (!this.isConnected || !this.producer) {
      throw new Error('Kafka producer not connected');
    }

    try {
      const topic = process.env.KAFKA_TOPIC_TELEMETRY || 'telemetry-data';
      const message = {
        key: telemetryData.deviceId || 'unknown',
        value: JSON.stringify({
          ...telemetryData,
          timestamp: telemetryData.timestamp || new Date().toISOString(),
          receivedAt: new Date().toISOString()
        })
      };

      const result = await this.producer.send({
        topic: topic,
        messages: [message]
      });

      logger.info('Telemetry message sent to Kafka', {
        topic: topic,
        partition: result[0].partition,
        offset: result[0].baseOffset,
        deviceId: telemetryData.deviceId
      });

      return {
        success: true,
        partition: result[0].partition,
        offset: result[0].baseOffset
      };
    } catch (error) {
      logger.error('Failed to send telemetry message to Kafka:', error);
      throw error;
    }
  }

  async getHealthStatus() {
    try {
      if (!this.isConnected) {
        return { status: 'disconnected', message: 'Kafka producer not connected' };
      }

      // Try to get metadata to check connection
      const admin = this.kafka.admin();
      await admin.connect();
      const metadata = await admin.fetchTopicMetadata({
        topics: [process.env.KAFKA_TOPIC_TELEMETRY || 'telemetry-data']
      });
      await admin.disconnect();

      return { 
        status: 'connected', 
        message: 'Kafka connection healthy',
        topics: metadata.topics
      };
    } catch (error) {
      logger.error('Kafka health check failed:', error);
      return { 
        status: 'error', 
        message: error.message 
      };
    }
  }
}

// Create singleton instance
const kafkaService = new KafkaService();

// Export functions for use in other modules
async function connectKafka() {
  return await kafkaService.connect();
}

async function disconnectKafka() {
  return await kafkaService.disconnect();
}

async function sendTelemetryMessage(telemetryData) {
  return await kafkaService.sendTelemetryMessage(telemetryData);
}

async function getKafkaHealth() {
  return await kafkaService.getHealthStatus();
}

module.exports = {
  connectKafka,
  disconnectKafka,
  sendTelemetryMessage,
  getKafkaHealth,
  kafkaService
}; 