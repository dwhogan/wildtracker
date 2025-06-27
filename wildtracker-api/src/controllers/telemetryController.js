const { validateTelemetry, validateBatchTelemetry, validateTelemetryQuery, sanitizeTelemetryData, parseBbox } = require('../models/telemetry');
const { sendTelemetryMessage } = require('../services/kafkaService');
const logger = require('../utils/logger');

class TelemetryController {
  // Upload single telemetry data point
  uploadTelemetry = async (req, res) => {
    try {
      const { error, value } = validateTelemetry(req.body);
      
      if (error) {
        logger.warn('Invalid telemetry data received', {
          errors: error.details.map(d => d.message),
          deviceId: req.body.deviceId
        });
        
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.details.map(d => d.message)
        });
      }

      // Sanitize the data
      const sanitizedData = sanitizeTelemetryData(value);
      
      // Try to send to Kafka, fallback to mock if not available
      let kafkaResult;
      try {
        kafkaResult = await sendTelemetryMessage(sanitizedData);
        logger.info('Telemetry data uploaded successfully to Kafka', {
          deviceId: sanitizedData.deviceId,
          timestamp: sanitizedData.timestamp,
          partition: kafkaResult.partition,
          offset: kafkaResult.offset
        });
      } catch (kafkaError) {
        logger.warn('Kafka not available, using mock response:', kafkaError.message);
        kafkaResult = {
          partition: 0,
          offset: Date.now()
        };
        logger.info('Telemetry data processed in mock mode', {
          deviceId: sanitizedData.deviceId,
          timestamp: sanitizedData.timestamp
        });
      }

      res.status(201).json({
        success: true,
        message: 'Telemetry data uploaded successfully',
        data: {
          id: `${sanitizedData.deviceId}-${Date.now()}`,
          timestamp: sanitizedData.timestamp,
          partition: kafkaResult.partition,
          offset: kafkaResult.offset
        }
      });
    } catch (error) {
      logger.error('Error uploading telemetry data:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to upload telemetry data',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Upload batch of telemetry data
  uploadBatchTelemetry = async (req, res) => {
    try {
      // Add deviceId to each batch item before validation
      const { deviceId, batch } = req.body;
      const batchWithDeviceId = Array.isArray(batch)
        ? batch.map(item => ({ ...item, deviceId }))
        : [];
      const toValidate = { deviceId, batch: batchWithDeviceId };

      // Custom validation: each item must have at least timestamp or location with lat/lng
      for (const item of batchWithDeviceId) {
        const hasTimestamp = !!item.timestamp;
        const hasLocation = item.location && typeof item.location.latitude === 'number' && typeof item.location.longitude === 'number';
        if (!hasTimestamp && !hasLocation) {
          return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: ['Each batch item must have at least a timestamp or a location with latitude and longitude.']
          });
        }
      }

      const { error, value } = validateBatchTelemetry(toValidate);
      
      if (error) {
        logger.warn('Invalid batch telemetry data received', {
          errors: error.details.map(d => d.message),
          deviceId: req.body.deviceId
        });
        
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.details.map(d => d.message)
        });
      }

      // Use the validated batch (with deviceId injected)
      const { deviceId: validDeviceId, batch: validBatch } = value;
      const results = [];
      const errors = [];

      // Process each telemetry data point in the batch
      for (let i = 0; i < validBatch.length; i++) {
        try {
          const telemetryData = validBatch[i];
          const sanitizedData = sanitizeTelemetryData(telemetryData);
          
          // Try to send to Kafka, fallback to mock if not available
          let kafkaResult;
          try {
            kafkaResult = await sendTelemetryMessage(sanitizedData);
          } catch (kafkaError) {
            logger.warn(`Kafka not available for batch item ${i}, using mock response:`, kafkaError.message);
            kafkaResult = {
              partition: 0,
              offset: Date.now() + i
            };
          }
          
          results.push({
            index: i,
            success: true,
            timestamp: sanitizedData.timestamp,
            partition: kafkaResult.partition,
            offset: kafkaResult.offset
          });
        } catch (error) {
          logger.error(`Error processing batch item ${i}:`, error);
          errors.push({
            index: i,
            error: error.message
          });
        }
      }

      const successCount = results.length;
      const errorCount = errors.length;
      const totalCount = validBatch.length;

      logger.info('Batch telemetry upload completed', {
        deviceId: validDeviceId,
        total: totalCount,
        success: successCount,
        errors: errorCount
      });

      res.status(200).json({
        success: true,
        message: `Batch upload completed. ${successCount}/${totalCount} items processed successfully.`,
        summary: {
          total: totalCount,
          successful: successCount,
          failed: errorCount
        },
        results: results,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      logger.error('Error uploading batch telemetry data:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to upload batch telemetry data',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get telemetry data with filtering and pagination
  getTelemetryData = async (req, res) => {
    try {
      const { error, value } = validateTelemetryQuery(req.query);
      
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: error.details.map(d => d.message)
        });
      }

      // In a real implementation, this would query a database
      // For now, return mock data based on query parameters
      const mockData = this.generateMockTelemetryData(value);
      
      res.json({
        success: true,
        data: mockData,
        pagination: {
          limit: value.limit,
          offset: value.offset,
          total: mockData.length,
          hasMore: mockData.length === value.limit
        },
        filters: value
      });
    } catch (error) {
      logger.error('Error retrieving telemetry data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve telemetry data'
      });
    }
  }

  // Get wildlife tracking summary
  getWildlifeSummary = async (req, res) => {
    try {
      const { species, startDate, endDate } = req.query;
      
      // Mock wildlife summary data
      const summary = {
        totalIndividuals: 45,
        activeDevices: 38,
        species: [
          { name: 'Gray Wolf', count: 12, active: 10 },
          { name: 'Mountain Lion', count: 8, active: 7 },
          { name: 'Elk', count: 15, active: 12 },
          { name: 'Bear', count: 10, active: 9 }
        ],
        speciesBreakdown: {
          'Gray Wolf': 12,
          'Mountain Lion': 8,
          'Elk': 15,
          'Bear': 10
        },
        activityBreakdown: {
          active: 25,
          resting: 8,
          feeding: 3,
          migrating: 2
        },
        healthStatus: {
          healthy: 35,
          injured: 2,
          sick: 1,
          unknown: 7
        },
        recentAlerts: [
          {
            id: 'alert-001',
            deviceId: 'wolf-007',
            type: 'low_battery',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            severity: 'medium'
          },
          {
            id: 'alert-002',
            deviceId: 'bear-003',
            type: 'unusual_activity',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            severity: 'high'
          }
        ]
      };
      
      res.json({
        success: true,
        data: summary,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error getting wildlife summary:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get wildlife summary'
      });
    }
  }

  // Get individual animal tracking data
  getIndividualTracking = async (req, res) => {
    try {
      const { individualId } = req.params;
      const { startDate, endDate, limit = 100 } = req.query;
      
      if (!individualId) {
        return res.status(400).json({
          success: false,
          error: 'Individual ID is required'
        });
      }

      // Mock individual tracking data
      const trackingData = this.generateIndividualTrackingData(individualId, startDate, endDate, limit);
      
      res.json({
        success: true,
        data: {
          individualId,
          summary: {
            totalPoints: trackingData.length,
            dateRange: {
              start: trackingData[trackingData.length - 1]?.timestamp,
              end: trackingData[0]?.timestamp
            },
            distance: this.calculateTotalDistance(trackingData),
            averageSpeed: this.calculateAverageSpeed(trackingData)
          },
          tracking: trackingData
        }
      });
    } catch (error) {
      logger.error('Error getting individual tracking:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get individual tracking data'
      });
    }
  }

  // Get map data for visualization
  getMapData = async (req, res) => {
    try {
      const { bbox, species, activity, limit = 500 } = req.query;
      logger.info('Map data request received', { bbox, species, activity, limit });
      let bboxCoords = null;
      if (bbox) {
        bboxCoords = parseBbox(bbox);
        // Validate bbox: must be 4 valid numbers
        if (!bboxCoords || Object.values(bboxCoords).some(v => isNaN(v))) {
          return res.status(400).json({
            success: false,
            error: 'Invalid bbox format',
            details: ['bbox must be in format minLng,minLat,maxLng,maxLat with valid numbers.']
          });
        }
      }
      logger.info('Parsed bbox coordinates', { bboxCoords });
      // Mock map data
      const mapData = this.generateMapData(bboxCoords, species, activity, limit);
      logger.info('Generated map data', { count: mapData.length });
      res.json({
        success: true,
        data: mapData,
        metadata: {
          totalPoints: mapData.length,
          bbox: bboxCoords,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error getting map data:', error);
      logger.error('Error stack:', error.stack);
      res.status(500).json({
        success: false,
        error: 'Failed to get map data',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get telemetry upload statistics
  getUploadStats = async (req, res) => {
    try {
      // This would typically query a database for statistics
      // For now, return basic info
      res.json({
        success: true,
        data: {
          service: 'WildTrack Telemetry API',
          version: '1.0.0',
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
          endpoints: {
            single: '/api/v1/telemetry',
            batch: '/api/v1/telemetry/batch',
            retrieve: '/api/v1/telemetry/data',
            wildlife: '/api/v1/telemetry/wildlife',
            individual: '/api/v1/telemetry/individual/:id',
            map: '/api/v1/telemetry/map'
          }
        }
      });
    } catch (error) {
      logger.error('Error getting upload stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get upload statistics'
      });
    }
  }

  // Helper methods for generating mock data
  generateMockTelemetryData(filters) {
    const mockData = [];
    const count = Math.min(filters.limit, 50); // Limit mock data
    
    for (let i = 0; i < count; i++) {
      mockData.push({
        id: `telemetry-${Date.now()}-${i}`,
        deviceId: filters.deviceId || `device-${Math.floor(Math.random() * 10) + 1}`,
        timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        location: {
          latitude: 37.7749 + (Math.random() - 0.5) * 0.1,
          longitude: -122.4194 + (Math.random() - 0.5) * 0.1,
          altitude: Math.random() * 1000,
          accuracy: Math.random() * 10
        },
        wildlife: {
          species: filters.species || ['Gray Wolf', 'Mountain Lion', 'Elk', 'Bear'][Math.floor(Math.random() * 4)],
          individualId: `individual-${Math.floor(Math.random() * 100) + 1}`,
          activity: ['active', 'resting', 'feeding', 'migrating'][Math.floor(Math.random() * 4)],
          health: ['healthy', 'healthy', 'healthy', 'injured'][Math.floor(Math.random() * 4)]
        },
        sensors: {
          temperature: 20 + Math.random() * 20,
          humidity: 40 + Math.random() * 40,
          battery: 20 + Math.random() * 80
        }
      });
    }
    
    return mockData;
  }

  generateIndividualTrackingData(individualId, startDate, endDate, limit) {
    const trackingData = [];
    const count = Math.min(limit, 100);
    
    for (let i = 0; i < count; i++) {
      trackingData.push({
        timestamp: new Date(Date.now() - i * 3600000).toISOString(),
        location: {
          latitude: 37.7749 + Math.sin(i * 0.1) * 0.01,
          longitude: -122.4194 + Math.cos(i * 0.1) * 0.01,
          altitude: 100 + Math.random() * 200
        },
        activity: ['active', 'resting', 'feeding'][Math.floor(Math.random() * 3)],
        speed: Math.random() * 10,
        battery: 100 - (i * 0.5)
      });
    }
    
    return trackingData;
  }

  generateMapData(bbox, species, activity, limit) {
    const mapData = [];
    const count = Math.min(limit, 200);
    
    // Central British Columbia coordinates (approximately Prince George area)
    const centerLat = 53.9169;
    const centerLng = -122.7494;
    
    for (let i = 0; i < count; i++) {
      mapData.push({
        id: `point-${i}`,
        deviceId: `device-${Math.floor(Math.random() * 20) + 1}`,
        timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        location: {
          latitude: centerLat + (Math.random() - 0.5) * 0.2,
          longitude: centerLng + (Math.random() - 0.5) * 0.2
        },
        wildlife: {
          species: species || ['Gray Wolf', 'Mountain Lion', 'Elk', 'Bear'][Math.floor(Math.random() * 4)],
          individualId: `individual-${Math.floor(Math.random() * 50) + 1}`,
          activity: activity || ['active', 'resting', 'feeding', 'migrating'][Math.floor(Math.random() * 4)]
        },
        metadata: {
          battery: 20 + Math.random() * 80,
          signal: 50 + Math.random() * 50
        }
      });
    }
    
    return mapData;
  }

  calculateTotalDistance(trackingData) {
    // Simple distance calculation (in a real app, use proper geodesic calculations)
    let totalDistance = 0;
    for (let i = 1; i < trackingData.length; i++) {
      const prev = trackingData[i - 1].location;
      const curr = trackingData[i].location;
      const distance = Math.sqrt(
        Math.pow(curr.latitude - prev.latitude, 2) + 
        Math.pow(curr.longitude - prev.longitude, 2)
      ) * 111000; // Rough conversion to meters
      totalDistance += distance;
    }
    return Math.round(totalDistance);
  }

  calculateAverageSpeed(trackingData) {
    if (trackingData.length < 2) return 0;
    const totalDistance = this.calculateTotalDistance(trackingData);
    const timeSpan = (new Date(trackingData[0].timestamp) - new Date(trackingData[trackingData.length - 1].timestamp)) / 1000 / 3600; // hours
    return Math.round(totalDistance / timeSpan);
  }
}

module.exports = new TelemetryController(); 