const request = require('supertest');
const express = require('express');
const telemetryRoutes = require('../src/routes/telemetry');
const healthRoutes = require('../src/routes/health');

// Mock external dependencies
jest.mock('../src/services/kafkaService', () => ({
  sendTelemetryMessage: jest.fn(),
  getKafkaHealth: jest.fn().mockResolvedValue({
    status: 'connected',
    message: 'Kafka is healthy',
    topics: ['test-topic']
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
app.use('/api/v1/health', healthRoutes);

describe('WildTracker API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Health Endpoints', () => {
    describe('GET /api/v1/health', () => {
      it('should return health status', async () => {
        const response = await request(app)
          .get('/api/v1/health')
          .expect(200);

        expect(response.body).toMatchObject({
          status: 'healthy',
          timestamp: expect.any(String),
          uptime: expect.any(Number)
        });
      });
    });

    describe('GET /api/v1/health/ready', () => {
      it('should return ready status', async () => {
        const response = await request(app)
          .get('/api/v1/health/ready')
          .expect(200);

        expect(response.body).toMatchObject({
          status: 'ready',
          timestamp: expect.any(String)
        });
      });
    });
  });

  describe('Telemetry Upload Endpoints', () => {
    const validTelemetryData = {
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
      }
    };

    describe('POST /api/v1/telemetry', () => {
      it('should successfully upload valid telemetry data', async () => {
        const { sendTelemetryMessage } = require('../src/services/kafkaService');
        sendTelemetryMessage.mockResolvedValue({
          partition: 0,
          offset: 12345
        });

        const response = await request(app)
          .post('/api/v1/telemetry')
          .send(validTelemetryData)
          .expect(201);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Telemetry data uploaded successfully',
          data: expect.objectContaining({
            id: expect.any(String),
            timestamp: expect.any(String),
            partition: 0,
            offset: 12345
          })
        });

        expect(sendTelemetryMessage).toHaveBeenCalledWith(expect.objectContaining({
          deviceId: 'test-device-123',
          timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
        }));
      });

      it('should handle Kafka failure gracefully', async () => {
        const { sendTelemetryMessage } = require('../src/services/kafkaService');
        sendTelemetryMessage.mockRejectedValue(new Error('Kafka connection failed'));

        const response = await request(app)
          .post('/api/v1/telemetry')
          .send(validTelemetryData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.partition).toBe(0);
      });

      it('should return 400 for missing deviceId', async () => {
        const invalidData = { ...validTelemetryData };
        delete invalidData.deviceId;

        const response = await request(app)
          .post('/api/v1/telemetry')
          .send(invalidData)
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          error: 'Validation failed',
          details: expect.arrayContaining([
            expect.stringContaining('deviceId')
          ])
        });
      });

      it('should return 400 for invalid latitude', async () => {
        const invalidData = {
          ...validTelemetryData,
          location: {
            ...validTelemetryData.location,
            latitude: 200 // Invalid latitude
          }
        };

        const response = await request(app)
          .post('/api/v1/telemetry')
          .send(invalidData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Validation failed');
      });

      it('should return 400 for invalid longitude', async () => {
        const invalidData = {
          ...validTelemetryData,
          location: {
            ...validTelemetryData.location,
            longitude: 200 // Invalid longitude
          }
        };

        const response = await request(app)
          .post('/api/v1/telemetry')
          .send(invalidData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Validation failed');
      });

      it('should return 400 for invalid timestamp format', async () => {
        const invalidData = {
          ...validTelemetryData,
          timestamp: 'invalid-timestamp'
        };

        const response = await request(app)
          .post('/api/v1/telemetry')
          .send(invalidData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Validation failed');
      });

      it('should sanitize and process telemetry data correctly', async () => {
        const { sendTelemetryMessage } = require('../src/services/kafkaService');
        sendTelemetryMessage.mockResolvedValue({
          partition: 0,
          offset: 12345
        });

        const dataWithExtraFields = {
          ...validTelemetryData,
          extraField: 'should be removed',
          location: {
            ...validTelemetryData.location,
            extraCoordinate: 'should be removed'
          }
        };

        await request(app)
          .post('/api/v1/telemetry')
          .send(dataWithExtraFields)
          .expect(201);

        // Verify that only expected fields are sent to Kafka
        expect(sendTelemetryMessage).toHaveBeenCalledWith(
          expect.not.objectContaining({
            extraField: 'should be removed'
          })
        );
      });
    });

    describe('POST /api/v1/telemetry/batch', () => {
      const validBatchData = {
        deviceId: 'test-device-123',
        batch: [
          {
            timestamp: '2024-01-15T10:30:00Z',
            location: {
              latitude: 37.7749,
              longitude: -122.4194
            },
            sensors: {
              temperature: 25.5
            }
          },
          {
            timestamp: '2024-01-15T10:31:00Z',
            location: {
              latitude: 37.7750,
              longitude: -122.4195
            },
            sensors: {
              temperature: 25.6
            }
          }
        ]
      };

      it('should successfully upload valid batch data', async () => {
        const { sendTelemetryMessage } = require('../src/services/kafkaService');
        sendTelemetryMessage.mockResolvedValue({
          partition: 0,
          offset: 12345
        });

        const response = await request(app)
          .post('/api/v1/telemetry/batch')
          .send(validBatchData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.summary).toEqual({ total: 2, successful: 2, failed: 0 });
        expect(response.body.results).toEqual([
          expect.objectContaining({
            index: 0,
            success: true,
            timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
            partition: 0,
            offset: 12345
          }),
          expect.objectContaining({
            index: 1,
            success: true,
            timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
            partition: 0,
            offset: 12345
          })
        ]);
      });

      it('should return 400 for invalid batch structure', async () => {
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

        expect(response.body).toMatchObject({
          success: false,
          error: 'Validation failed',
          details: [expect.stringContaining('at least a timestamp or a location')]
        });
      });

      it('should handle empty batch', async () => {
        const emptyBatchData = {
          deviceId: 'test-device',
          batch: []
        };

        const response = await request(app)
          .post('/api/v1/telemetry/batch')
          .send(emptyBatchData)
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          error: 'Validation failed'
        });
      });

      it('should return 400 for missing deviceId in batch', async () => {
        const invalidBatchData = {
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
          .send(invalidBatchData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Validation failed');
      });
    });
  });

  describe('Telemetry Retrieval Endpoints', () => {
    describe('GET /api/v1/telemetry/data', () => {
      it('should return telemetry data with valid query parameters', async () => {
        const response = await request(app)
          .get('/api/v1/telemetry/data')
          .query({
            deviceId: 'test-device',
            species: 'Gray Wolf',
            limit: 10,
            offset: 0
          })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              deviceId: expect.any(String),
              timestamp: expect.any(String),
              location: expect.objectContaining({
                latitude: expect.any(Number),
                longitude: expect.any(Number)
              })
            })
          ]),
          pagination: expect.objectContaining({
            limit: 10,
            offset: 0,
            total: expect.any(Number)
          }),
          filters: expect.objectContaining({
            deviceId: 'test-device',
            species: 'Gray Wolf',
            limit: 10,
            offset: 0
          })
        });
      });

      it('should return 400 for invalid query parameters', async () => {
        const response = await request(app)
          .get('/api/v1/telemetry/data')
          .query({
            limit: 'invalid' // Should be a number
          })
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          error: 'Invalid query parameters'
        });
      });

      it('should handle empty query parameters', async () => {
        const response = await request(app)
          .get('/api/v1/telemetry/data')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
      });

      it('should respect limit parameter', async () => {
        const response = await request(app)
          .get('/api/v1/telemetry/data')
          .query({ limit: 5 })
          .expect(200);

        expect(response.body.data.length).toBeLessThanOrEqual(5);
      });
    });

    describe('GET /api/v1/telemetry/wildlife', () => {
      it('should return wildlife summary data', async () => {
        const response = await request(app)
          .get('/api/v1/telemetry/wildlife')
          .query({
            species: 'Gray Wolf',
            startDate: '2024-01-01',
            endDate: '2024-01-31'
          })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: expect.objectContaining({
            totalIndividuals: expect.any(Number),
            activeDevices: expect.any(Number),
            species: expect.arrayContaining([
              expect.objectContaining({
                name: expect.any(String),
                count: expect.any(Number),
                active: expect.any(Number)
              })
            ]),
            speciesBreakdown: expect.any(Object),
            activityBreakdown: expect.any(Object),
            healthStatus: expect.any(Object),
            recentAlerts: expect.arrayContaining([
              expect.objectContaining({
                id: expect.any(String),
                deviceId: expect.any(String),
                type: expect.any(String),
                severity: expect.any(String)
              })
            ])
          }),
          timestamp: expect.any(String)
        });
      });

      it('should handle empty query parameters', async () => {
        const response = await request(app)
          .get('/api/v1/telemetry/wildlife')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Object);
      });
    });

    describe('GET /api/v1/telemetry/individual/:id', () => {
      it('should return individual tracking data', async () => {
        const response = await request(app)
          .get('/api/v1/telemetry/individual/wolf-001')
          .query({
            startDate: '2024-01-01',
            endDate: '2024-01-31',
            limit: 50
          })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: expect.objectContaining({
            individualId: 'wolf-001',
            summary: expect.objectContaining({
              totalPoints: expect.any(Number),
              dateRange: expect.objectContaining({
                start: expect.any(String),
                end: expect.any(String)
              }),
              distance: expect.any(Number),
              averageSpeed: expect.any(Number)
            }),
            tracking: expect.arrayContaining([
              expect.objectContaining({
                timestamp: expect.any(String),
                location: expect.objectContaining({
                  latitude: expect.any(Number),
                  longitude: expect.any(Number),
                  altitude: expect.any(Number)
                }),
                activity: expect.any(String),
                speed: expect.any(Number),
                battery: expect.any(Number)
              })
            ])
          })
        });
      });

      it('should return 400 for missing individual ID', async () => {
        const response = await request(app)
          .get('/api/v1/telemetry/individual/')
          .expect(404);

        // Express will return 404 for missing route parameter
        expect(response.status).toBe(404);
      });

      it('should handle empty query parameters', async () => {
        const response = await request(app)
          .get('/api/v1/telemetry/individual/wolf-001')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Object);
      });

      it('should respect limit parameter', async () => {
        const response = await request(app)
          .get('/api/v1/telemetry/individual/wolf-001')
          .query({ limit: 10 })
          .expect(200);

        expect(response.body.data.tracking.length).toBeLessThanOrEqual(10);
      });
    });

    describe('GET /api/v1/telemetry/map', () => {
      it('should return map data with valid parameters', async () => {
        const response = await request(app)
          .get('/api/v1/telemetry/map')
          .query({
            bbox: '37.7,-122.4,37.8,-122.3',
            species: 'Gray Wolf',
            activity: 'active',
            limit: 100
          })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              deviceId: expect.any(String),
              timestamp: expect.any(String),
              location: expect.objectContaining({
                latitude: expect.any(Number),
                longitude: expect.any(Number)
              }),
              wildlife: expect.objectContaining({
                species: expect.any(String),
                individualId: expect.any(String),
                activity: expect.any(String)
              }),
              metadata: expect.objectContaining({
                battery: expect.any(Number),
                signal: expect.any(Number)
              })
            })
          ]),
          metadata: expect.objectContaining({
            totalPoints: expect.any(Number),
            timestamp: expect.any(String)
          })
        });
      });

      it('should handle missing bbox parameter', async () => {
        const response = await request(app)
          .get('/api/v1/telemetry/map')
          .query({
            species: 'Gray Wolf',
            limit: 50
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
      });

      it('should handle invalid bbox format', async () => {
        const response = await request(app)
          .get('/api/v1/telemetry/map')
          .query({
            bbox: 'invalid-bbox-format',
            limit: 50
          })
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          error: 'Invalid bbox format',
          details: [expect.stringContaining('bbox must be in format')]
        });
      });

      it('should respect limit parameter', async () => {
        const response = await request(app)
          .get('/api/v1/telemetry/map')
          .query({ limit: 10 })
          .expect(200);

        expect(response.body.data.length).toBeLessThanOrEqual(10);
      });

      it('should filter by species when provided', async () => {
        const response = await request(app)
          .get('/api/v1/telemetry/map')
          .query({
            species: 'Gray Wolf',
            limit: 50
          })
          .expect(200);

        // All returned data should have the specified species
        response.body.data.forEach(point => {
          expect(point.wildlife.species).toBe('Gray Wolf');
        });
      });

      it('should filter by activity when provided', async () => {
        const response = await request(app)
          .get('/api/v1/telemetry/map')
          .query({
            activity: 'active',
            limit: 50
          })
          .expect(200);

        // All returned data should have the specified activity
        response.body.data.forEach(point => {
          expect(point.wildlife.activity).toBe('active');
        });
      });
    });

    describe('GET /api/v1/telemetry/stats', () => {
      it('should return upload statistics', async () => {
        const response = await request(app)
          .get('/api/v1/telemetry/stats')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: expect.objectContaining({
            service: 'WildTrack Telemetry API',
            version: '1.0.0',
            uptime: expect.any(Number),
            timestamp: expect.any(String),
            endpoints: expect.objectContaining({
              single: '/api/v1/telemetry',
              batch: '/api/v1/telemetry/batch',
              retrieve: '/api/v1/telemetry/data',
              wildlife: '/api/v1/telemetry/wildlife',
              individual: '/api/v1/telemetry/individual/:id',
              map: '/api/v1/telemetry/map'
            })
          })
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/v1/telemetry')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      // Express returns empty body for malformed JSON
      expect(response.body).toEqual({});
    });

    it('should handle unsupported HTTP methods', async () => {
      const response = await request(app)
        .put('/api/v1/telemetry')
        .expect(404);

      expect(response.status).toBe(404);
    });

    it('should handle missing Content-Type for POST requests', async () => {
      const response = await request(app)
        .post('/api/v1/telemetry')
        .send('{"deviceId": "test"}')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.any(String)
      });
    });
  });

  describe('Performance and Limits', () => {
    it('should handle large batch uploads', async () => {
      const { sendTelemetryMessage } = require('../src/services/kafkaService');
      sendTelemetryMessage.mockResolvedValue({
        partition: 0,
        offset: 12345
      });

      const largeBatch = {
        deviceId: 'test-device',
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
        .send(largeBatch)
        .expect(200);

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(response.body.summary.total).toBe(100);
      expect(response.body.summary.successful).toBe(100);
      expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should respect query parameter limits', async () => {
      const response = await request(app)
        .get('/api/v1/telemetry/data')
        .query({ limit: 1000 }) // Very large limit
        .expect(200);

      // Should be capped to a reasonable maximum
      expect(response.body.data.length).toBeLessThanOrEqual(200);
    });
  });
}); 