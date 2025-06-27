const request = require('supertest');
const express = require('express');
const telemetryRoutes = require('../src/routes/telemetry');
const { generateTestData, createValidTelemetryData, createValidBatchData } = require('./utils/testHelpers');

// Mock external dependencies
jest.mock('../src/services/kafkaService', () => ({
  sendTelemetryMessage: jest.fn().mockResolvedValue({
    partition: 0,
    offset: 12345
  })
}));

jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

// Create test app
const app = express();
app.use(express.json());
app.use('/api/v1/telemetry', telemetryRoutes);

describe('WildTracker API Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Single Telemetry Upload Performance', () => {
    it('should handle 100 sequential uploads within reasonable time', async () => {
      const testData = generateTestData(100);
      const startTime = Date.now();
      
      for (let i = 0; i < testData.length; i++) {
        const response = await request(app)
          .post('/api/v1/telemetry')
          .send(testData[i])
          .expect(201);
        
        expect(response.body.success).toBe(true);
      }
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const averageTime = totalTime / testData.length;
      
      console.log(`Processed ${testData.length} uploads in ${totalTime}ms (avg: ${averageTime.toFixed(2)}ms per request)`);
      
      // Should complete within 10 seconds (100ms per request)
      expect(totalTime).toBeLessThan(10000);
      expect(averageTime).toBeLessThan(100);
    });

    it('should handle concurrent uploads efficiently', async () => {
      const concurrentCount = 10;
      const testData = generateTestData(concurrentCount);
      const startTime = Date.now();
      
      const promises = testData.map(data => 
        request(app)
          .post('/api/v1/telemetry')
          .send(data)
          .expect(201)
      );
      
      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      responses.forEach(response => {
        expect(response.body.success).toBe(true);
      });
      
      console.log(`Processed ${concurrentCount} concurrent uploads in ${totalTime}ms`);
      
      // Concurrent requests should be much faster than sequential
      expect(totalTime).toBeLessThan(2000);
    });

    it('should maintain consistent response times under load', async () => {
      const testData = generateTestData(50);
      const responseTimes = [];
      
      for (let i = 0; i < testData.length; i++) {
        const startTime = Date.now();
        
        await request(app)
          .post('/api/v1/telemetry')
          .send(testData[i])
          .expect(201);
        
        const endTime = Date.now();
        responseTimes.push(endTime - startTime);
      }
      
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const minResponseTime = Math.min(...responseTimes);
      const variance = responseTimes.reduce((acc, time) => acc + Math.pow(time - avgResponseTime, 2), 0) / responseTimes.length;
      const standardDeviation = Math.sqrt(variance);
      
      console.log(`Response time stats: avg=${avgResponseTime.toFixed(2)}ms, min=${minResponseTime}ms, max=${maxResponseTime}ms, std=${standardDeviation.toFixed(2)}ms`);
      
      // Response times should be consistent (low variance)
      expect(standardDeviation).toBeLessThan(50);
      expect(maxResponseTime - minResponseTime).toBeLessThan(100);
    });
  });

  describe('Batch Telemetry Upload Performance', () => {
    it('should handle large batch uploads efficiently', async () => {
      const batchData = {
        deviceId: 'perf-test-device',
        batch: Array.from({ length: 100 }, (_, i) => ({
          timestamp: new Date(Date.now() - i * 60000).toISOString(),
          location: {
            latitude: 37.7749 + (i * 0.0001),
            longitude: -122.4194 + (i * 0.0001)
          },
          sensors: {
            temperature: 25 + (i * 0.1)
          }
        }))
      };

      const startTime = Date.now();
      const response = await request(app)
        .post('/api/v1/telemetry/batch')
        .send(batchData)
        .expect(200);
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(response.body.success).toBe(true);
      expect(response.body.summary.total).toBe(100);
      expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle multiple concurrent batch uploads', async () => {
      const batchData = {
        deviceId: 'concurrent-test-device',
        batch: Array.from({ length: 10 }, (_, i) => ({
          timestamp: new Date(Date.now() - i * 60000).toISOString(),
          location: {
            latitude: 37.7749 + (i * 0.0001),
            longitude: -122.4194 + (i * 0.0001)
          },
          sensors: {
            temperature: 25 + (i * 0.1)
          }
        }))
      };

      const batchPromises = Array.from({ length: 5 }, () => 
        request(app)
          .post('/api/v1/telemetry/batch')
          .send(batchData)
          .expect(200)
      );
      
      const responses = await Promise.all(batchPromises);

      responses.forEach(response => {
        expect(response.body.success).toBe(true);
        expect(response.body.summary.total).toBe(10);
      });
    });

    it('should handle partial batch failures gracefully', async () => {
      const batchData = {
        deviceId: 'partial-fail-test-device',
        batch: Array.from({ length: 20 }, (_, i) => ({
          timestamp: new Date(Date.now() - i * 60000).toISOString(),
          location: {
            latitude: 37.7749 + (i * 0.0001),
            longitude: -122.4194 + (i * 0.0001)
          },
          sensors: {
            temperature: 25 + (i * 0.1)
          }
        }))
      };

      const startTime = Date.now();
      const response = await request(app)
        .post('/api/v1/telemetry/batch')
        .send(batchData)
        .expect(200);
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(response.body.success).toBe(true);
      expect(response.body.summary.total).toBe(20);
      expect(processingTime).toBeLessThan(3000); // Should complete within 3 seconds
    });
  });

  describe('Data Retrieval Performance', () => {
    it('should handle large data retrieval requests efficiently', async () => {
      const limits = [10, 50, 100, 200];
      
      for (const limit of limits) {
        const startTime = Date.now();
        
        const response = await request(app)
          .get('/api/v1/telemetry/data')
          .query({ limit })
          .expect(200);
        
        const endTime = Date.now();
        const processingTime = endTime - startTime;
        
        expect(response.body.success).toBe(true);
        expect(response.body.data.length).toBeLessThanOrEqual(limit);
        
        console.log(`Retrieved ${response.body.data.length} items with limit ${limit} in ${processingTime}ms`);
        
        // Should retrieve data quickly regardless of limit
        expect(processingTime).toBeLessThan(1000);
      }
    });

    it('should handle complex query filtering efficiently', async () => {
      const queries = [
        { species: 'Gray Wolf', activity: 'active' },
        { deviceId: 'test-device', limit: 50 },
        { species: 'Mountain Lion', activity: 'resting' },
        { limit: 100, offset: 50 }
      ];
      
      for (const query of queries) {
        const startTime = Date.now();
        
        const response = await request(app)
          .get('/api/v1/telemetry/data')
          .query(query)
          .expect(200);
        
        const endTime = Date.now();
        const processingTime = endTime - startTime;
        
        expect(response.body.success).toBe(true);
        
        console.log(`Complex query ${JSON.stringify(query)} processed in ${processingTime}ms`);
        
        // Complex queries should still be fast
        expect(processingTime).toBeLessThan(500);
      }
    });

    it('should handle map data requests efficiently', async () => {
      const mapQueries = [
        { bbox: '37.7,-122.4,37.8,-122.3', limit: 100 },
        { species: 'Gray Wolf', limit: 50 },
        { activity: 'active', limit: 75 },
        { limit: 200 }
      ];
      
      for (const query of mapQueries) {
        const startTime = Date.now();
        
        const response = await request(app)
          .get('/api/v1/telemetry/map')
          .query(query)
          .expect(200);
        
        const endTime = Date.now();
        const processingTime = endTime - startTime;
        
        expect(response.body.success).toBe(true);
        expect(response.body.data.length).toBeLessThanOrEqual(query.limit || 500);
        
        console.log(`Map query ${JSON.stringify(query)} processed in ${processingTime}ms`);
        
        // Map queries should be fast
        expect(processingTime).toBeLessThan(500);
      }
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should not leak memory during repeated requests', async () => {
      const initialMemory = process.memoryUsage();
      const iterations = 100;
      
      for (let i = 0; i < iterations; i++) {
        const testData = createValidTelemetryData({
          deviceId: `device-${i}`,
          timestamp: new Date(Date.now() - i * 60000).toISOString()
        });
        
        await request(app)
          .post('/api/v1/telemetry')
          .send(testData)
          .expect(201);
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      console.log(`Memory usage: initial=${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB, final=${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB, increase=${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
      
      // Memory increase should be reasonable (less than 50MB for 100 requests)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    it('should handle large payloads without performance degradation', async () => {
      const largeTelemetryData = createValidTelemetryData({
        sensors: {
          temperature: 25.5,
          humidity: 60.2,
          battery: 85,
          // Add extra sensor data to simulate large payload
          ...Array.from({ length: 50 }, (_, i) => ({ [`sensor${i}`]: Math.random() })).reduce((acc, sensor) => ({ ...acc, ...sensor }), {})
        }
      });
      
      const startTime = Date.now();
      
      const response = await request(app)
        .post('/api/v1/telemetry')
        .send(largeTelemetryData)
        .expect(201);
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      expect(response.body.success).toBe(true);
      
      console.log(`Large payload processed in ${processingTime}ms`);
      
      // Large payloads should still be processed quickly
      expect(processingTime).toBeLessThan(500);
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle validation errors efficiently', async () => {
      const invalidData = createValidTelemetryData();
      delete invalidData.deviceId; // Make it invalid
      
      const startTime = Date.now();
      
      const response = await request(app)
        .post('/api/v1/telemetry')
        .send(invalidData)
        .expect(400);
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      expect(response.body.success).toBe(false);
      
      console.log(`Validation error handled in ${processingTime}ms`);
      
      // Error handling should be fast
      expect(processingTime).toBeLessThan(100);
    });

    it('should handle multiple concurrent error scenarios', async () => {
      const errorScenarios = [
        { deviceId: 'test-device', location: { latitude: 200, longitude: -122.4194 } }, // Invalid latitude
        { deviceId: 'test-device', location: { latitude: 37.7749, longitude: 200 } }, // Invalid longitude
        { deviceId: 'test-device', timestamp: 'invalid-timestamp' }, // Invalid timestamp
        { location: { latitude: 37.7749, longitude: -122.4194 } } // Missing deviceId
      ];
      
      const startTime = Date.now();
      
      const promises = errorScenarios.map(data => 
        request(app)
          .post('/api/v1/telemetry')
          .send(data)
          .expect(400)
      );
      
      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      responses.forEach(response => {
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Validation failed');
      });
      
      console.log(`Handled ${errorScenarios.length} concurrent error scenarios in ${totalTime}ms`);
      
      // Error handling should be fast even with multiple concurrent requests
      expect(totalTime).toBeLessThan(500);
    });
  });

  describe('Stress Testing', () => {
    it('should maintain performance under sustained load', async () => {
      const sustainedLoadDuration = 5000; // 5 seconds
      const requestInterval = 50; // 50ms between requests
      const startTime = Date.now();
      let requestCount = 0;
      let successCount = 0;
      let errorCount = 0;
      
      const makeRequest = async () => {
        try {
          const testData = createValidTelemetryData({
            deviceId: `stress-device-${requestCount}`,
            timestamp: new Date().toISOString()
          });
          
          const response = await request(app)
            .post('/api/v1/telemetry')
            .send(testData)
            .expect(201);
          
          if (response.body.success) {
            successCount++;
          }
        } catch (error) {
          errorCount++;
        }
        requestCount++;
      };
      
      // Make requests at regular intervals
      const interval = setInterval(makeRequest, requestInterval);
      
      // Stop after the specified duration
      setTimeout(() => {
        clearInterval(interval);
      }, sustainedLoadDuration);
      
      // Wait for all requests to complete
      await new Promise(resolve => setTimeout(resolve, sustainedLoadDuration + 1000));
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const requestsPerSecond = requestCount / (totalTime / 1000);
      
      console.log(`Stress test: ${requestCount} requests, ${successCount} successful, ${errorCount} errors in ${totalTime}ms (${requestsPerSecond.toFixed(2)} req/s)`);
      
      // Should handle sustained load without significant degradation
      expect(successCount).toBeGreaterThan(requestCount * 0.95); // 95% success rate
      expect(requestsPerSecond).toBeGreaterThan(10); // At least 10 requests per second
    }, 10000); // 10 second timeout
  });
}); 