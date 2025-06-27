const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const API_KEY = process.env.API_KEY || 'your-api-key';

// Example wildlife telemetry data
const wildlifeTelemetryData = {
  deviceId: 'wolf-collar-001',
  timestamp: new Date().toISOString(),
  location: {
    latitude: 37.7749,
    longitude: -122.4194,
    altitude: 150.5,
    accuracy: 3.2
  },
  wildlife: {
    species: 'Gray Wolf',
    individualId: 'wolf-alpha-001',
    collarId: 'collar-2024-001',
    activity: 'active',
    behavior: 'hunting',
    health: 'healthy',
    weight: 45.2,
    age: 4,
    gender: 'male',
    habitat: 'forest',
    territory: 'north-ridge'
  },
  sensors: {
    temperature: 18.5,
    humidity: 65.2,
    pressure: 1013.25,
    acceleration: {
      x: 0.2,
      y: -0.1,
      z: 9.8
    }
  },
  metadata: {
    version: '2.1.0',
    battery: 78,
    signal: 85,
    firmware: 'v2.1.0',
    model: 'WildTrack-Collar-Pro',
    manufacturer: 'WildTrack Inc.'
  },
  tags: ['wolf', 'alpha', 'north-ridge', 'hunting'],
  priority: 'normal'
};

// Example batch wildlife data
const wildlifeBatchData = {
  deviceId: 'elk-collar-002',
  batch: [
    {
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      location: {
        latitude: 37.7750,
        longitude: -122.4195
      },
      wildlife: {
        species: 'Elk',
        individualId: 'elk-female-001',
        activity: 'feeding',
        health: 'healthy'
      },
      sensors: {
        temperature: 22.1,
        humidity: 58.3
      }
    },
    {
      timestamp: new Date().toISOString(),
      location: {
        latitude: 37.7752,
        longitude: -122.4197
      },
      wildlife: {
        species: 'Elk',
        individualId: 'elk-female-001',
        activity: 'active',
        health: 'healthy'
      },
      sensors: {
        temperature: 23.5,
        humidity: 55.8
      }
    }
  ]
};

async function uploadWildlifeTelemetry() {
  try {
    console.log('🦊 Uploading wildlife telemetry data...');
    
    const response = await axios.post(`${API_BASE_URL}/api/v1/telemetry`, wildlifeTelemetryData, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      }
    });

    console.log('✅ Wildlife telemetry uploaded successfully!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error uploading wildlife telemetry:', error.response?.data || error.message);
  }
}

async function uploadWildlifeBatch() {
  try {
    console.log('🦌 Uploading batch wildlife data...');
    
    const response = await axios.post(`${API_BASE_URL}/api/v1/telemetry/batch`, wildlifeBatchData, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      }
    });

    console.log('✅ Batch wildlife data uploaded successfully!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error uploading batch wildlife data:', error.response?.data || error.message);
  }
}

async function getWildlifeSummary() {
  try {
    console.log('📊 Getting wildlife tracking summary...');
    
    const response = await axios.get(`${API_BASE_URL}/api/v1/telemetry/wildlife`, {
      headers: {
        'X-API-Key': API_KEY
      }
    });
    
    console.log('✅ Wildlife summary retrieved successfully!');
    console.log('Summary:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error getting wildlife summary:', error.response?.data || error.message);
  }
}

async function getTelemetryData() {
  try {
    console.log('📈 Getting filtered telemetry data...');
    
    const params = {
      species: 'Gray Wolf',
      limit: 10,
      sortBy: 'timestamp',
      sortOrder: 'desc'
    };
    
    const response = await axios.get(`${API_BASE_URL}/api/v1/telemetry/data`, {
      params,
      headers: {
        'X-API-Key': API_KEY
      }
    });
    
    console.log('✅ Telemetry data retrieved successfully!');
    console.log('Data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error getting telemetry data:', error.response?.data || error.message);
  }
}

async function getIndividualTracking() {
  try {
    console.log('🦊 Getting individual wolf tracking data...');
    
    const individualId = 'wolf-alpha-001';
    const params = {
      limit: 50
    };
    
    const response = await axios.get(`${API_BASE_URL}/api/v1/telemetry/individual/${individualId}`, {
      params,
      headers: {
        'X-API-Key': API_KEY
      }
    });
    
    console.log('✅ Individual tracking data retrieved successfully!');
    console.log('Tracking Data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error getting individual tracking:', error.response?.data || error.message);
  }
}

async function getMapData() {
  try {
    console.log('🗺️ Getting map data for visualization...');
    
    const params = {
      bbox: '-122.5,37.7,-122.3,37.8', // San Francisco area
      species: 'Gray Wolf',
      activity: 'active',
      limit: 100
    };
    
    const response = await axios.get(`${API_BASE_URL}/api/v1/telemetry/map`, {
      params,
      headers: {
        'X-API-Key': API_KEY
      }
    });
    
    console.log('✅ Map data retrieved successfully!');
    console.log('Map Data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error getting map data:', error.response?.data || error.message);
  }
}

async function getHealthStatus() {
  try {
    console.log('🏥 Checking API health...');
    
    const response = await axios.get(`${API_BASE_URL}/health`);
    
    console.log('✅ Health check successful!');
    console.log('Health status:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Health check failed:', error.response?.data || error.message);
  }
}

// Frontend integration examples
async function demonstrateFrontendIntegration() {
  console.log('\n🎯 Frontend Integration Examples:\n');
  
  // Example 1: Dashboard data
  console.log('1. Dashboard Data (Wildlife Summary):');
  try {
    const summaryResponse = await axios.get(`${API_BASE_URL}/api/v1/telemetry/wildlife`);
    const summary = summaryResponse.data.data;
    
    console.log(`   - Total Individuals: ${summary.totalIndividuals}`);
    console.log(`   - Active Devices: ${summary.activeDevices}`);
    console.log(`   - Species Count: ${summary.species.length}`);
    console.log(`   - Recent Alerts: ${summary.recentAlerts.length}`);
  } catch (error) {
    console.log('   ❌ Failed to get dashboard data');
  }
  
  // Example 2: Map markers
  console.log('\n2. Map Markers (Map Data):');
  try {
    const mapResponse = await axios.get(`${API_BASE_URL}/api/v1/telemetry/map?limit=5`);
    const mapData = mapResponse.data.data;
    
    console.log(`   - Total Map Points: ${mapData.length}`);
    mapData.slice(0, 3).forEach((point, index) => {
      console.log(`   - Point ${index + 1}: ${point.wildlife.species} at [${point.location.latitude}, ${point.location.longitude}]`);
    });
  } catch (error) {
    console.log('   ❌ Failed to get map data');
  }
  
  // Example 3: Individual tracking path
  console.log('\n3. Individual Tracking Path:');
  try {
    const trackingResponse = await axios.get(`${API_BASE_URL}/api/v1/telemetry/individual/wolf-alpha-001?limit=5`);
    const tracking = trackingResponse.data.data;
    
    console.log(`   - Individual: ${tracking.individualId}`);
    console.log(`   - Total Points: ${tracking.summary.totalPoints}`);
    console.log(`   - Distance: ${tracking.summary.distance}m`);
    console.log(`   - Average Speed: ${tracking.summary.averageSpeed}m/h`);
  } catch (error) {
    console.log('   ❌ Failed to get tracking data');
  }
}

// Main function
async function main() {
  console.log('🦁 WildTrack Wildlife Tracking API Example\n');
  
  // Check health first
  await getHealthStatus();
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Upload wildlife data
  await uploadWildlifeTelemetry();
  console.log('\n' + '='.repeat(60) + '\n');
  
  await uploadWildlifeBatch();
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Get various data for frontend
  await getWildlifeSummary();
  console.log('\n' + '='.repeat(60) + '\n');
  
  await getTelemetryData();
  console.log('\n' + '='.repeat(60) + '\n');
  
  await getIndividualTracking();
  console.log('\n' + '='.repeat(60) + '\n');
  
  await getMapData();
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Demonstrate frontend integration
  await demonstrateFrontendIntegration();
  
  console.log('\n✨ Wildlife tracking example completed!');
  console.log('\n📱 Frontend Integration Notes:');
  console.log('   - Use /api/v1/telemetry/wildlife for dashboard widgets');
  console.log('   - Use /api/v1/telemetry/map for map markers and clustering');
  console.log('   - Use /api/v1/telemetry/individual/:id for tracking paths');
  console.log('   - Use /api/v1/telemetry/data for data tables and filtering');
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  uploadWildlifeTelemetry,
  uploadWildlifeBatch,
  getWildlifeSummary,
  getTelemetryData,
  getIndividualTracking,
  getMapData,
  getHealthStatus,
  demonstrateFrontendIntegration
}; 