/**
 * Test utilities for WildTracker API tests
 * Following Kent Beck's TDD principles
 */

const { sendTelemetryMessage } = require('../../src/services/kafkaService');

/**
 * Create a valid telemetry data object for testing
 * @param {Object} overrides - Properties to override
 * @returns {Object} Valid telemetry data
 */
const createValidTelemetryData = (overrides = {}) => ({
  deviceId: 'test-device-123',
  timestamp: '2024-01-15T10:30:00Z',
  location: {
    latitude: 37.7749,
    longitude: -122.4194,
    altitude: 100,
    accuracy: 5
  },
  wildlife: {
    species: 'Gray Wolf',
    individualId: 'wolf-001',
    activity: 'active',
    health: 'healthy'
  },
  sensors: {
    temperature: 25.5,
    humidity: 60.2,
    battery: 85
  },
  ...overrides
});

/**
 * Create a valid batch telemetry data object for testing
 * @param {number} count - Number of items in batch
 * @param {Object} overrides - Properties to override
 * @returns {Object} Valid batch telemetry data
 */
const createValidBatchData = (count = 2, overrides = {}) => ({
  deviceId: 'test-device-123',
  batch: Array.from({ length: count }, (_, i) => ({
    timestamp: new Date(Date.now() - i * 60000).toISOString(),
    location: {
      latitude: 37.7749 + (i * 0.0001),
      longitude: -122.4194 + (i * 0.0001),
      altitude: 100 + i,
      accuracy: 5
    },
    wildlife: {
      species: 'Gray Wolf',
      individualId: `wolf-${i + 1}`,
      activity: 'active',
      health: 'healthy'
    },
    sensors: {
      temperature: 25 + (i * 0.1),
      humidity: 60 + (i * 0.2),
      battery: 85 - (i * 0.5)
    }
  })),
  ...overrides
});

/**
 * Create mock request object for testing
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock request object
 */
const createMockRequest = (overrides = {}) => ({
  body: {},
  query: {},
  params: {},
  headers: {},
  ...overrides
});

/**
 * Create mock response object for testing
 * @returns {Object} Mock response object
 */
const createMockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis()
  };
  
  // Add helper methods for assertions
  res.expectStatus = (statusCode) => {
    expect(res.status).toHaveBeenCalledWith(statusCode);
    return res;
  };
  
  res.expectJson = (expectedData) => {
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining(expectedData));
    return res;
  };
  
  res.getResponseData = () => {
    return res.json.mock.calls[0]?.[0];
  };
  
  return res;
};

/**
 * Mock Kafka service for testing
 * @param {Object} options - Mock options
 */
const mockKafkaService = (options = {}) => {
  const {
    shouldSucceed = true,
    partition = 0,
    offset = 12345,
    error = new Error('Kafka error')
  } = options;

  if (shouldSucceed) {
    sendTelemetryMessage.mockResolvedValue({ partition, offset });
  } else {
    sendTelemetryMessage.mockRejectedValue(error);
  }
};

/**
 * Create invalid telemetry data for testing validation
 * @param {string} type - Type of invalidity
 * @returns {Object} Invalid telemetry data
 */
const createInvalidTelemetryData = (type) => {
  const baseData = createValidTelemetryData();
  
  switch (type) {
    case 'missingDeviceId':
      const { deviceId, ...dataWithoutDeviceId } = baseData;
      return dataWithoutDeviceId;
      
    case 'invalidLatitude':
      return {
        ...baseData,
        location: {
          ...baseData.location,
          latitude: 200 // Invalid latitude
        }
      };
      
    case 'invalidLongitude':
      return {
        ...baseData,
        location: {
          ...baseData.location,
          longitude: 200 // Invalid longitude
        }
      };
      
    case 'invalidTimestamp':
      return {
        ...baseData,
        timestamp: 'invalid-timestamp'
      };
      
    case 'missingLocation':
      const { location, ...dataWithoutLocation } = baseData;
      return dataWithoutLocation;
      
    case 'emptyLocation':
      return {
        ...baseData,
        location: {}
      };
      
    default:
      return baseData;
  }
};

/**
 * Create invalid batch data for testing validation
 * @param {string} type - Type of invalidity
 * @returns {Object} Invalid batch data
 */
const createInvalidBatchData = (type) => {
  const baseData = createValidBatchData(2);
  
  switch (type) {
    case 'missingDeviceId':
      const { deviceId, ...dataWithoutDeviceId } = baseData;
      return dataWithoutDeviceId;
      
    case 'emptyBatch':
      return {
        ...baseData,
        batch: []
      };
      
    case 'invalidBatchItem':
      return {
        ...baseData,
        batch: [
          {
            // Missing required fields
            timestamp: '2024-01-15T10:30:00Z'
          }
        ]
      };
      
    case 'missingBatch':
      const { batch, ...dataWithoutBatch } = baseData;
      return dataWithoutBatch;
      
    default:
      return baseData;
  }
};

/**
 * Assert common API response structure
 * @param {Object} response - API response object
 * @param {boolean} shouldSucceed - Whether the response should be successful
 */
const assertApiResponse = (response, shouldSucceed = true) => {
  if (shouldSucceed) {
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
  } else {
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error');
  }
};

/**
 * Assert telemetry data structure
 * @param {Object} telemetryData - Telemetry data object
 */
const assertTelemetryDataStructure = (telemetryData) => {
  expect(telemetryData).toHaveProperty('id');
  expect(telemetryData).toHaveProperty('deviceId');
  expect(telemetryData).toHaveProperty('timestamp');
  expect(telemetryData).toHaveProperty('location');
  expect(telemetryData.location).toHaveProperty('latitude');
  expect(telemetryData.location).toHaveProperty('longitude');
  expect(telemetryData).toHaveProperty('wildlife');
  expect(telemetryData.wildlife).toHaveProperty('species');
  expect(telemetryData.wildlife).toHaveProperty('individualId');
  expect(telemetryData.wildlife).toHaveProperty('activity');
  expect(telemetryData).toHaveProperty('sensors');
};

/**
 * Assert location data structure
 * @param {Object} location - Location data object
 */
const assertLocationStructure = (location) => {
  expect(location).toHaveProperty('latitude');
  expect(location).toHaveProperty('longitude');
  expect(typeof location.latitude).toBe('number');
  expect(typeof location.longitude).toBe('number');
  expect(location.latitude).toBeGreaterThanOrEqual(-90);
  expect(location.latitude).toBeLessThanOrEqual(90);
  expect(location.longitude).toBeGreaterThanOrEqual(-180);
  expect(location.longitude).toBeLessThanOrEqual(180);
};

/**
 * Wait for a specified number of milliseconds
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} Promise that resolves after the specified time
 */
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generate test data for performance testing
 * @param {number} count - Number of data points to generate
 * @returns {Array} Array of telemetry data points
 */
const generateTestData = (count) => {
  return Array.from({ length: count }, (_, i) => ({
    deviceId: `device-${Math.floor(i / 10) + 1}`,
    timestamp: new Date(Date.now() - i * 60000).toISOString(),
    location: {
      latitude: 37.7749 + (Math.random() - 0.5) * 0.1,
      longitude: -122.4194 + (Math.random() - 0.5) * 0.1,
      altitude: Math.random() * 1000,
      accuracy: Math.random() * 10
    },
    wildlife: {
      species: ['Gray Wolf', 'Mountain Lion', 'Elk', 'Bear'][Math.floor(Math.random() * 4)],
      individualId: `individual-${Math.floor(Math.random() * 50) + 1}`,
      activity: ['active', 'resting', 'feeding', 'migrating'][Math.floor(Math.random() * 4)],
      health: ['healthy', 'injured', 'sick'][Math.floor(Math.random() * 3)]
    },
    sensors: {
      temperature: 20 + Math.random() * 20,
      humidity: 40 + Math.random() * 40,
      battery: 20 + Math.random() * 80
    }
  }));
};

module.exports = {
  createValidTelemetryData,
  createValidBatchData,
  createMockRequest,
  createMockResponse,
  mockKafkaService,
  createInvalidTelemetryData,
  createInvalidBatchData,
  assertApiResponse,
  assertTelemetryDataStructure,
  assertLocationStructure,
  wait,
  generateTestData
}; 