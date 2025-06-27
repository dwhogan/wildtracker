const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const API_KEY = process.env.API_KEY || 'your-api-key';

// Example telemetry data
const sampleTelemetryData = {
  deviceId: 'sensor-001',
  timestamp: new Date().toISOString(),
  location: {
    latitude: 37.7749,
    longitude: -122.4194,
    altitude: 10.5,
    accuracy: 5.0
  },
  sensors: {
    temperature: 25.5,
    humidity: 60.2,
    pressure: 1013.25,
    light: 450.0,
    sound: 35.2
  },
  metadata: {
    version: '1.0.0',
    battery: 85,
    signal: 92,
    firmware: 'v2.1.0',
    model: 'WildTrack-Sensor-Pro',
    manufacturer: 'WildTrack Inc.'
  },
  tags: ['outdoor', 'weather', 'environmental'],
  priority: 'normal'
};

// Example batch telemetry data
const sampleBatchData = {
  deviceId: 'sensor-002',
  batch: [
    {
      timestamp: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
      location: {
        latitude: 37.7750,
        longitude: -122.4195
      },
      sensors: {
        temperature: 24.8,
        humidity: 58.5
      }
    },
    {
      timestamp: new Date().toISOString(),
      location: {
        latitude: 37.7751,
        longitude: -122.4196
      },
      sensors: {
        temperature: 25.2,
        humidity: 59.1
      }
    }
  ]
};

async function uploadSingleTelemetry() {
  try {
    console.log('Uploading single telemetry data...');
    
    const response = await axios.post(`${API_BASE_URL}/api/v1/telemetry`, sampleTelemetryData, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      }
    });

    console.log('✅ Single telemetry uploaded successfully!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error uploading single telemetry:', error.response?.data || error.message);
  }
}

async function uploadBatchTelemetry() {
  try {
    console.log('Uploading batch telemetry data...');
    
    const response = await axios.post(`${API_BASE_URL}/api/v1/telemetry/batch`, sampleBatchData, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      }
    });

    console.log('✅ Batch telemetry uploaded successfully!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error uploading batch telemetry:', error.response?.data || error.message);
  }
}

async function getHealthStatus() {
  try {
    console.log('Checking API health...');
    
    const response = await axios.get(`${API_BASE_URL}/health`);
    
    console.log('✅ Health check successful!');
    console.log('Health status:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Health check failed:', error.response?.data || error.message);
  }
}

async function getTelemetryStats() {
  try {
    console.log('Getting telemetry stats...');
    
    const response = await axios.get(`${API_BASE_URL}/api/v1/telemetry/stats`);
    
    console.log('✅ Stats retrieved successfully!');
    console.log('Stats:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error getting stats:', error.response?.data || error.message);
  }
}

// Main function
async function main() {
  console.log('🚀 WildTrack Telemetry API Example\n');
  
  // Check health first
  await getHealthStatus();
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Upload single telemetry
  await uploadSingleTelemetry();
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Upload batch telemetry
  await uploadBatchTelemetry();
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Get stats
  await getTelemetryStats();
  
  console.log('\n✨ Example completed!');
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  uploadSingleTelemetry,
  uploadBatchTelemetry,
  getHealthStatus,
  getTelemetryStats
}; 