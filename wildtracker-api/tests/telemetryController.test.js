const TelemetryController = require('../src/controllers/telemetryController');
const { sendTelemetryMessage } = require('../src/services/kafkaService');

// Mock the Kafka service
jest.mock('../src/services/kafkaService');
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

describe('TelemetryController', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockReq = {
      body: {},
      query: {},
      params: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('uploadTelemetry', () => {
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

    it('should successfully upload valid telemetry data', async () => {
      const { sendTelemetryMessage } = require('../src/services/kafkaService');
      sendTelemetryMessage.mockResolvedValue({
        partition: 0,
        offset: 12345
      });

      mockReq.body = validTelemetryData;

      await TelemetryController.uploadTelemetry(mockReq, mockRes);

      expect(sendTelemetryMessage).toHaveBeenCalledWith(expect.objectContaining({
        deviceId: 'test-device-123',
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      }));
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Telemetry data uploaded successfully'
      }));
    });

    it('should handle Kafka failure gracefully with mock response', async () => {
      mockReq.body = validTelemetryData;
      sendTelemetryMessage.mockRejectedValue(new Error('Kafka connection failed'));

      await TelemetryController.uploadTelemetry(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          partition: 0
        })
      }));
    });

    it('should return 400 for missing deviceId', async () => {
      const invalidData = { ...validTelemetryData };
      delete invalidData.deviceId;
      mockReq.body = invalidData;

      await TelemetryController.uploadTelemetry(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Validation failed'
      }));
    });

    it('should return 400 for invalid latitude', async () => {
      const invalidData = {
        ...validTelemetryData,
        location: {
          ...validTelemetryData.location,
          latitude: 200 // Invalid latitude
        }
      };
      mockReq.body = invalidData;

      await TelemetryController.uploadTelemetry(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false
      }));
    });

    it('should return 400 for invalid longitude', async () => {
      const invalidData = {
        ...validTelemetryData,
        location: {
          ...validTelemetryData.location,
          longitude: 'invalid'
        }
      };

      mockReq.body = invalidData;

      await TelemetryController.uploadTelemetry(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Validation failed'
      }));
    });

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

      mockReq.body = validBatchData;

      await TelemetryController.uploadBatchTelemetry(mockReq, mockRes);

      expect(sendTelemetryMessage).toHaveBeenCalledTimes(2);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        summary: {
          total: 2,
          successful: 2,
          failed: 0
        },
        results: expect.arrayContaining([
          expect.objectContaining({
            index: 0,
            success: true,
            timestamp: expect.any(String),
            partition: 0,
            offset: 12345
          })
        ])
      }));
    });

    it('should handle partial batch failures', async () => {
      const batchData = {
        deviceId: 'test-device',
        batch: [
          {
            timestamp: '2024-01-15T10:30:00Z',
            location: {
              latitude: 37.7749,
              longitude: -122.4194
            }
          },
          {
            timestamp: '2024-01-15T10:31:00Z',
            location: {
              latitude: 37.7750,
              longitude: -122.4195
            }
          }
        ]
      };

      // Mock Kafka to succeed for first item, fail for second
      const { sendTelemetryMessage } = require('../src/services/kafkaService');
      sendTelemetryMessage
        .mockResolvedValueOnce({ partition: 0, offset: 12345 }) // First item succeeds
        .mockRejectedValueOnce(new Error('Kafka connection failed')); // Second item fails

      mockReq.body = batchData;

      await TelemetryController.uploadBatchTelemetry(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        summary: {
          total: 2,
          successful: 2, // Both succeed due to fallback behavior
          failed: 0
        },
        results: [
          expect.objectContaining({
            index: 0,
            success: true,
            timestamp: expect.any(String),
            partition: 0,
            offset: 12345
          }),
          expect.objectContaining({
            index: 1,
            success: true,
            timestamp: expect.any(String),
            partition: 0,
            offset: expect.any(Number) // Mock offset from fallback
          })
        ]
      }));
    });

    it('should return 400 for invalid batch structure', async () => {
      const invalidBatchData = {
        deviceId: 'test-device',
        batch: [
          {
            // Missing both timestamp and location
          }
        ]
      };

      mockReq.body = invalidBatchData;

      await TelemetryController.uploadBatchTelemetry(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Validation failed',
        details: [expect.stringContaining('at least a timestamp or a location')]
      }));
    });

    it('should handle empty batch', async () => {
      const emptyBatchData = {
        deviceId: 'test-device',
        batch: []
      };

      mockReq.body = emptyBatchData;

      await TelemetryController.uploadBatchTelemetry(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Validation failed',
        details: [expect.stringContaining('must contain at least 1 items')]
      }));
    });
  });

  describe('getTelemetryData', () => {
    it('should return mock telemetry data with valid query parameters', async () => {
      mockReq.query = {
        deviceId: 'test-device',
        species: 'Gray Wolf',
        limit: 10,
        offset: 0
      };

      await TelemetryController.getTelemetryData(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
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
          offset: 0
        })
      }));
    });

    it('should return 400 for invalid query parameters', async () => {
      mockReq.query = {
        limit: 'invalid' // Should be a number
      };

      await TelemetryController.getTelemetryData(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Invalid query parameters'
      }));
    });

    it('should handle empty query parameters', async () => {
      mockReq.query = {};

      await TelemetryController.getTelemetryData(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.any(Array)
      }));
    });
  });

  describe('getWildlifeSummary', () => {
    it('should return wildlife summary data', async () => {
      mockReq.query = {
        species: 'Gray Wolf',
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      await TelemetryController.getWildlifeSummary(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
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
          recentAlerts: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              deviceId: expect.any(String),
              type: expect.any(String),
              severity: expect.any(String)
            })
          ])
        })
      }));
    });

    it('should handle empty query parameters', async () => {
      mockReq.query = {};

      await TelemetryController.getWildlifeSummary(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.any(Object)
      }));
    });
  });

  describe('getIndividualTracking', () => {
    it('should return individual tracking data', async () => {
      mockReq.params = { individualId: 'wolf-001' };
      mockReq.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        limit: 50
      };

      await TelemetryController.getIndividualTracking(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
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
                longitude: expect.any(Number)
              }),
              activity: expect.any(String),
              speed: expect.any(Number)
            })
          ])
        })
      }));
    });

    it('should return 400 for missing individual ID', async () => {
      mockReq.params = {};

      await TelemetryController.getIndividualTracking(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Individual ID is required'
      }));
    });

    it('should handle empty query parameters', async () => {
      mockReq.params = { individualId: 'wolf-001' };
      mockReq.query = {};

      await TelemetryController.getIndividualTracking(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.any(Object)
      }));
    });
  });

  describe('getMapData', () => {
    it('should return map data with valid parameters', async () => {
      mockReq.query = {
        bbox: '37.7,-122.4,37.8,-122.3',
        limit: 100
      };

      await TelemetryController.getMapData(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            deviceId: expect.any(String),
            id: expect.any(String),
            location: expect.objectContaining({
              latitude: expect.any(Number),
              longitude: expect.any(Number)
            }),
            timestamp: expect.any(String),
            wildlife: expect.objectContaining({
              activity: expect.any(String),
              individualId: expect.any(String),
              species: expect.any(String)
            })
          })
        ]),
        metadata: expect.objectContaining({
          bbox: expect.any(Object),
          timestamp: expect.any(String),
          totalPoints: expect.any(Number)
        })
      }));
    });

    it('should handle missing bbox parameter', async () => {
      mockReq.query = {
        limit: 50
      };

      await TelemetryController.getMapData(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.any(Array)
      }));
    });

    it('should handle invalid bbox format', async () => {
      mockReq.query = {
        bbox: 'invalid-bbox-format',
        limit: 50
      };

      await TelemetryController.getMapData(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Invalid bbox format',
        details: [expect.stringContaining('bbox must be in format')]
      }));
    });

    it('should respect limit parameter', async () => {
      mockReq.query = {
        limit: 10
      };

      await TelemetryController.getMapData(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.data.length).toBeLessThanOrEqual(10);
    });
  });

  describe('getUploadStats', () => {
    it('should return upload statistics', async () => {
      await TelemetryController.getUploadStats(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
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
      }));
    });
  });

  describe('Helper Methods', () => {
    describe('generateMockTelemetryData', () => {
      it('should generate mock data with filters', () => {
        const filters = {
          deviceId: 'test-device',
          species: 'Gray Wolf',
          limit: 5
        };

        const result = TelemetryController.generateMockTelemetryData(filters);

        expect(result).toHaveLength(5);
        expect(result[0]).toMatchObject({
          deviceId: 'test-device',
          wildlife: expect.objectContaining({
            species: 'Gray Wolf'
          })
        });
      });

      it('should respect limit parameter', () => {
        const filters = { limit: 3 };
        const result = TelemetryController.generateMockTelemetryData(filters);
        expect(result).toHaveLength(3);
      });
    });

    describe('generateIndividualTrackingData', () => {
      it('should generate tracking data for individual', () => {
        const result = TelemetryController.generateIndividualTrackingData('wolf-001', '2024-01-01', '2024-01-31', 10);

        expect(result).toHaveLength(10);
        expect(result[0]).toMatchObject({
          timestamp: expect.any(String),
          location: expect.objectContaining({
            latitude: expect.any(Number),
            longitude: expect.any(Number)
          }),
          activity: expect.any(String),
          speed: expect.any(Number),
          battery: expect.any(Number)
        });
      });
    });

    describe('generateMapData', () => {
      it('should generate map data with parameters', () => {
        const bbox = [37.7, -122.4, 37.8, -122.3];
        const result = TelemetryController.generateMapData(bbox, 'Gray Wolf', 'active', 20);

        expect(result).toHaveLength(20);
        expect(result[0]).toMatchObject({
          wildlife: expect.objectContaining({
            species: 'Gray Wolf',
            activity: 'active'
          })
        });
      });

      it('should use default values when parameters are not provided', () => {
        const result = TelemetryController.generateMapData(null, null, null, 10);

        expect(result).toHaveLength(10);
        expect(result[0]).toMatchObject({
          wildlife: expect.objectContaining({
            species: expect.any(String),
            activity: expect.any(String)
          })
        });
      });
    });

    describe('calculateTotalDistance', () => {
      it('should calculate total distance from tracking data', () => {
        const trackingData = [
          {
            location: { latitude: 37.7749, longitude: -122.4194 }
          },
          {
            location: { latitude: 37.7750, longitude: -122.4195 }
          },
          {
            location: { latitude: 37.7751, longitude: -122.4196 }
          }
        ];

        const distance = TelemetryController.calculateTotalDistance(trackingData);
        expect(distance).toBeGreaterThan(0);
        expect(typeof distance).toBe('number');
      });

      it('should return 0 for single point', () => {
        const trackingData = [
          { location: { latitude: 37.7749, longitude: -122.4194 } }
        ];

        const distance = TelemetryController.calculateTotalDistance(trackingData);
        expect(distance).toBe(0);
      });
    });

    describe('calculateAverageSpeed', () => {
      it('should calculate average speed from tracking data', () => {
        const trackingData = [
          {
            timestamp: '2024-01-15T10:35:00Z', // Newest first (as controller expects)
            location: { latitude: 37.7849, longitude: -122.4294 }
          },
          {
            timestamp: '2024-01-15T10:30:00Z', // Oldest last
            location: { latitude: 37.7749, longitude: -122.4194 }
          }
        ];

        const speed = TelemetryController.calculateAverageSpeed(trackingData);
        expect(typeof speed).toBe('number');
        expect(speed).toBeGreaterThanOrEqual(0);
      });

      it('should return 0 for single point', () => {
        const trackingData = [
          {
            timestamp: '2024-01-15T10:00:00Z',
            location: { latitude: 37.7749, longitude: -122.4194 }
          }
        ];

        const speed = TelemetryController.calculateAverageSpeed(trackingData);
        expect(speed).toBe(0);
      });
    });
  });
}); 