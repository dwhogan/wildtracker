# WildTrack API - Telemetry Upload Service

A Node.js web API application for wildlife telemetry data upload with Kafka persistence, designed to support frontend applications for wildlife tracking and map visualization.

## Features

- RESTful API for wildlife telemetry data upload
- Kafka integration for data persistence
- Wildlife-specific data fields (species, individual tracking, activity, health)
- Map data endpoints for frontend visualization
- Individual animal tracking and path analysis
- Wildlife summary and statistics
- Rate limiting and security middleware
- Comprehensive logging with Winston
- Input validation with Joi
- CORS support
- Health check endpoints
- Docker support

## Prerequisites

- Node.js 18+ 
- Apache Kafka (running locally or remotely)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp env.example .env
# Edit .env with your configuration
```

3. Start the application:
```bash
npm run dev
```

## API Endpoints

### Telemetry Upload
- **`POST /api/v1/telemetry`** - Upload single telemetry data point
- **`POST /api/v1/telemetry/batch`** - Upload batch telemetry data points

### Data Retrieval & Frontend Support
- **`GET /api/v1/telemetry/data`** - Get telemetry data with filtering and pagination
- **`GET /api/v1/telemetry/wildlife`** - Get wildlife tracking summary and statistics
- **`GET /api/v1/telemetry/individual/:id`** - Get individual animal tracking data
- **`GET /api/v1/telemetry/map`** - Get map data for visualization

### System
- **`GET /api/v1/telemetry/stats`** - Get upload statistics
- **`GET /health`** - Basic health check
- **`GET /health/detailed`** - Detailed system health

## Wildlife Telemetry Data Structure

```json
{
  "deviceId": "wolf-collar-001",
  "timestamp": "2024-01-15T10:30:00Z",
  "location": {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "altitude": 150.5,
    "accuracy": 3.2
  },
  "wildlife": {
    "species": "Gray Wolf",
    "individualId": "wolf-alpha-001",
    "collarId": "collar-2024-001",
    "activity": "active",
    "behavior": "hunting",
    "health": "healthy",
    "weight": 45.2,
    "age": 4,
    "gender": "male",
    "habitat": "forest",
    "territory": "north-ridge"
  },
  "sensors": {
    "temperature": 18.5,
    "humidity": 65.2,
    "pressure": 1013.25,
    "acceleration": {
      "x": 0.2,
      "y": -0.1,
      "z": 9.8
    }
  },
  "metadata": {
    "battery": 78,
    "signal": 85,
    "firmware": "v2.1.0"
  },
  "tags": ["wolf", "alpha", "north-ridge"],
  "priority": "normal"
}
```

## Frontend Integration

### Dashboard Widgets
Use `/api/v1/telemetry/wildlife` to get summary data for dashboard widgets:
- Total individuals tracked
- Active devices count
- Species breakdown
- Activity statistics
- Health status
- Recent alerts

### Map Visualization
Use `/api/v1/telemetry/map` with query parameters for map data:
```javascript
// Get map data for specific area and species
const response = await fetch('/api/v1/telemetry/map?bbox=-122.5,37.7,-122.3,37.8&species=Gray Wolf&limit=100');
const mapData = await response.json();
```

### Individual Tracking Paths
Use `/api/v1/telemetry/individual/:id` for tracking individual animals:
```javascript
// Get tracking path for specific animal
const response = await fetch('/api/v1/telemetry/individual/wolf-alpha-001?limit=100');
const trackingData = await response.json();
```

### Data Tables & Filtering
Use `/api/v1/telemetry/data` for filtered data retrieval:
```javascript
// Get filtered telemetry data
const response = await fetch('/api/v1/telemetry/data?species=Gray Wolf&startDate=2024-01-01&limit=50');
const telemetryData = await response.json();
```

## Query Parameters

### Map Data (`/api/v1/telemetry/map`)
- `bbox` - Bounding box (minLng,minLat,maxLng,maxLat)
- `species` - Filter by species
- `activity` - Filter by activity type
- `limit` - Maximum number of points (default: 500)

### Telemetry Data (`/api/v1/telemetry/data`)
- `deviceId` - Filter by device ID
- `species` - Filter by species
- `individualId` - Filter by individual animal
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)
- `limit` - Maximum results (default: 100)
- `offset` - Pagination offset (default: 0)
- `sortBy` - Sort field (timestamp, deviceId, species)
- `sortOrder` - Sort order (asc, desc)
- `activity` - Filter by activity
- `health` - Filter by health status

## Example Usage

### Run Wildlife Tracking Example
```bash
node examples/wildlife-tracking-example.js
```

### Upload Wildlife Data
```bash
curl -X POST http://localhost:3000/api/v1/telemetry \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "wolf-collar-001",
    "wildlife": {
      "species": "Gray Wolf",
      "individualId": "wolf-alpha-001",
      "activity": "active"
    },
    "location": {
      "latitude": 37.7749,
      "longitude": -122.4194
    }
  }'
```

### Get Map Data
```bash
curl "http://localhost:3000/api/v1/telemetry/map?bbox=-122.5,37.7,-122.3,37.8&species=Gray Wolf&limit=10"
```

## Configuration

Key environment variables in `.env`:
- `PORT`: Server port (default: 3000)
- `KAFKA_BROKERS`: Kafka broker addresses
- `KAFKA_TOPIC_TELEMETRY`: Kafka topic for telemetry data
- `CORS_ORIGIN`: Allowed CORS origins for frontend

## Docker Quick Start

```bash
# Start with Kafka and UI
docker-compose up -d

# Access services
# API: http://localhost:3000
# Kafka UI: http://localhost:8080
```

## Frontend Development

The API is designed to work seamlessly with frontend frameworks like:
- React with Leaflet/Mapbox for maps
- Vue.js with OpenLayers
- Angular with Google Maps
- Any framework with mapping libraries

Key frontend integration points:
1. **Real-time updates**: Poll map data endpoints for live tracking
2. **Clustering**: Use map data with clustering libraries for performance
3. **Filtering**: Leverage query parameters for dynamic filtering
4. **Path visualization**: Use individual tracking data for path rendering
5. **Dashboard**: Use wildlife summary for statistics and alerts

## Project Structure

```
wildtrack-api/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Express middleware
│   ├── models/          # Data models and validation
│   ├── services/        # Business logic and Kafka service
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   └── server.js        # Main server file
├── tests/               # Test files
├── logs/                # Log files
├── docker-compose.yml   # Docker configuration
└── Dockerfile          # Docker image
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT 