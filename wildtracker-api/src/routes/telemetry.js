const express = require('express');
const router = express.Router();
const telemetryController = require('../controllers/telemetryController');

/**
 * @route POST /api/v1/telemetry
 * @desc Upload single telemetry data point
 * @access Public
 */
router.post('/', telemetryController.uploadTelemetry);

/**
 * @route POST /api/v1/telemetry/batch
 * @desc Upload batch of telemetry data points
 * @access Public
 */
router.post('/batch', telemetryController.uploadBatchTelemetry);

/**
 * @route GET /api/v1/telemetry/data
 * @desc Get telemetry data with filtering and pagination
 * @access Public
 */
router.get('/data', telemetryController.getTelemetryData);

/**
 * @route GET /api/v1/telemetry/wildlife
 * @desc Get wildlife tracking summary and statistics
 * @access Public
 */
router.get('/wildlife', telemetryController.getWildlifeSummary);

/**
 * @route GET /api/v1/telemetry/individual/:individualId
 * @desc Get individual animal tracking data
 * @access Public
 */
router.get('/individual/:individualId', telemetryController.getIndividualTracking);

/**
 * @route GET /api/v1/telemetry/map
 * @desc Get map data for visualization
 * @access Public
 */
router.get('/map', telemetryController.getMapData);

/**
 * @route GET /api/v1/telemetry/stats
 * @desc Get telemetry upload statistics
 * @access Public
 */
router.get('/stats', telemetryController.getUploadStats);

module.exports = router; 