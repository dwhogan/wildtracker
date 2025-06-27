// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.KAFKA_BROKERS = 'localhost:9092';
process.env.KAFKA_TOPIC_TELEMETRY = 'test-telemetry-data';
process.env.LOG_LEVEL = 'error';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}; 