const request = require('supertest');
const express = require('express');
const telemetryRoutes = require('../src/routes/telemetry');

// Create a test app
const app = express();
app.use(express.json());
app.use('/api/v1/telemetry', telemetryRoutes);

describe('Telemetry API', () => {
  describe('POST /api/v1/telemetry', () => {
    it('should return 400 for invalid telemetry data', async () => {
      const invalidData = {
        // Missing required deviceId
        timestamp: '2024-01-15T10:30:00Z',
        location: {
          latitude: 37.7749,
          longitude: -122.4194
        }
      };

      const response = await request(app)
        .post('/api/v1/telemetry')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 for invalid location data', async () => {
      const invalidData = {
        deviceId: 'test-device',
        location: {
          latitude: 200, // Invalid latitude
          longitude: -122.4194
        }
      };

      const response = await request(app)
        .post('/api/v1/telemetry')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should accept valid telemetry data', async () => {
      const validData = {
        deviceId: 'test-device-123',
        timestamp: '2024-01-15T10:30:00Z',
        location: {
          latitude: 37.7749,
          longitude: -122.4194
        }
      };

      const response = await request(app)
        .post('/api/v1/telemetry')
        .send(validData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Telemetry data uploaded successfully');
    });
  });

  describe('POST /api/v1/telemetry/batch', () => {
    it('should accept valid batch data structure', async () => {
      const validBatchData = {
        deviceId: 'test-device-123',
        batch: [
          {
            timestamp: '2024-01-15T10:30:00Z',
            location: {
              latitude: 37.7749,
              longitude: -122.4194
            }
          }
        ]
      };

      const response = await request(app)
        .post('/api/v1/telemetry/batch')
        .send(validBatchData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.summary.total).toBe(1);
      expect(response.body.results).toEqual([
        expect.objectContaining({
          index: 0,
          success: true,
          timestamp: expect.stringMatching(/^2024-01-15T10:30:00\.\d{3}Z$/),
          partition: 0,
          offset: expect.any(Number)
        })
      ]);
    });

    it('should return 400 for invalid batch data', async () => {
      const invalidBatchData = {
        deviceId: 'test-device',
        batch: [
          {
            // Missing required fields: both timestamp and location
          }
        ]
      };

      const response = await request(app)
        .post('/api/v1/telemetry/batch')
        .send(invalidBatchData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details[0]).toMatch(/at least a timestamp or a location/);
    });
  });

  describe('GET /api/v1/telemetry/stats', () => {
    it('should return stats information', async () => {
      const response = await request(app)
        .get('/api/v1/telemetry/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.service).toBe('WildTrack Telemetry API');
      expect(response.body.data.version).toBe('1.0.0');
      expect(response.body.data.endpoints).toBeDefined();
    });
  });
}); 