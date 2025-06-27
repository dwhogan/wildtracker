const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');

/**
 * @route GET /health
 * @desc Basic health check
 * @access Public
 */
router.get('/', healthController.getHealth);

/**
 * @route GET /health/detailed
 * @desc Detailed health check with system information
 * @access Public
 */
router.get('/detailed', healthController.getDetailedHealth);

/**
 * @route GET /health/ready
 * @desc Readiness check for Kubernetes
 * @access Public
 */
router.get('/ready', healthController.getReadiness);

/**
 * @route GET /health/live
 * @desc Liveness check for Kubernetes
 * @access Public
 */
router.get('/live', healthController.getLiveness);

module.exports = router; 