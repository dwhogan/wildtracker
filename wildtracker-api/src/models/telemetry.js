const Joi = require('joi');

// Telemetry data validation schema
const telemetrySchema = Joi.object({
  deviceId: Joi.string().required().min(1).max(100),
  timestamp: Joi.date().iso().default(() => new Date().toISOString()),
  location: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    altitude: Joi.number().optional(),
    accuracy: Joi.number().min(0).optional()
  }).optional(),
  sensors: Joi.object({
    temperature: Joi.number().min(-273.15).max(1000).optional(),
    humidity: Joi.number().min(0).max(100).optional(),
    pressure: Joi.number().min(0).max(2000).optional(),
    light: Joi.number().min(0).optional(),
    sound: Joi.number().min(0).optional(),
    vibration: Joi.number().min(0).optional(),
    acceleration: Joi.object({
      x: Joi.number().optional(),
      y: Joi.number().optional(),
      z: Joi.number().optional()
    }).optional(),
    gyroscope: Joi.object({
      x: Joi.number().optional(),
      y: Joi.number().optional(),
      z: Joi.number().optional()
    }).optional(),
    magnetic: Joi.object({
      x: Joi.number().optional(),
      y: Joi.number().optional(),
      z: Joi.number().optional()
    }).optional()
  }).optional(),
  // Wildlife-specific fields
  wildlife: Joi.object({
    species: Joi.string().optional(),
    individualId: Joi.string().optional(),
    collarId: Joi.string().optional(),
    activity: Joi.string().valid('active', 'resting', 'feeding', 'migrating', 'unknown').optional(),
    behavior: Joi.string().optional(),
    health: Joi.string().valid('healthy', 'injured', 'sick', 'unknown').optional(),
    weight: Joi.number().min(0).optional(),
    age: Joi.number().min(0).optional(),
    gender: Joi.string().valid('male', 'female', 'unknown').optional(),
    habitat: Joi.string().optional(),
    territory: Joi.string().optional()
  }).optional(),
  metadata: Joi.object({
    version: Joi.string().optional(),
    battery: Joi.number().min(0).max(100).optional(),
    signal: Joi.number().min(0).max(100).optional(),
    firmware: Joi.string().optional(),
    model: Joi.string().optional(),
    manufacturer: Joi.string().optional(),
    custom: Joi.object().optional()
  }).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  priority: Joi.string().valid('low', 'normal', 'high', 'critical').default('normal')
});

// Batch telemetry validation schema
const batchTelemetrySchema = Joi.object({
  deviceId: Joi.string().required().min(1).max(100),
  batch: Joi.array().items(telemetrySchema).min(1).max(100).required()
});

// Query parameters for telemetry retrieval
const telemetryQuerySchema = Joi.object({
  deviceId: Joi.string().optional(),
  species: Joi.string().optional(),
  individualId: Joi.string().optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  limit: Joi.number().integer().min(1).max(1000).default(100),
  offset: Joi.number().integer().min(0).default(0),
  sortBy: Joi.string().valid('timestamp', 'deviceId', 'species').default('timestamp'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  activity: Joi.string().optional(),
  health: Joi.string().optional(),
  bbox: Joi.string().pattern(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?$/).optional() // "minLng,minLat,maxLng,maxLat"
});

// Validation functions
function validateTelemetry(data) {
  return telemetrySchema.validate(data, { 
    abortEarly: false,
    stripUnknown: true 
  });
}

function validateBatchTelemetry(data) {
  return batchTelemetrySchema.validate(data, { 
    abortEarly: false,
    stripUnknown: true 
  });
}

function validateTelemetryQuery(query) {
  return telemetryQuerySchema.validate(query, { 
    abortEarly: false,
    stripUnknown: true 
  });
}

// Helper function to sanitize telemetry data
function sanitizeTelemetryData(data) {
  const sanitized = { ...data };
  
  // Ensure timestamp is ISO string
  if (sanitized.timestamp) {
    sanitized.timestamp = new Date(sanitized.timestamp).toISOString();
  }
  
  // Round numeric values to reasonable precision
  if (sanitized.location) {
    if (sanitized.location.latitude) {
      sanitized.location.latitude = Math.round(sanitized.location.latitude * 1000000) / 1000000;
    }
    if (sanitized.location.longitude) {
      sanitized.location.longitude = Math.round(sanitized.location.longitude * 1000000) / 1000000;
    }
  }
  
  if (sanitized.sensors) {
    Object.keys(sanitized.sensors).forEach(key => {
      if (typeof sanitized.sensors[key] === 'number') {
        sanitized.sensors[key] = Math.round(sanitized.sensors[key] * 1000) / 1000;
      }
    });
  }
  
  return sanitized;
}

// Helper function to parse bounding box
function parseBbox(bboxString) {
  if (!bboxString) return null;
  const [minLng, minLat, maxLng, maxLat] = bboxString.split(',').map(Number);
  return { minLng, minLat, maxLng, maxLat };
}

module.exports = {
  telemetrySchema,
  batchTelemetrySchema,
  telemetryQuerySchema,
  validateTelemetry,
  validateBatchTelemetry,
  validateTelemetryQuery,
  sanitizeTelemetryData,
  parseBbox
}; 