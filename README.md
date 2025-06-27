# WildTracker

A comprehensive wildlife tracking system that combines real-time telemetry data collection with an interactive web dashboard for monitoring wildlife populations and movements.

## 🦊 Overview

WildTracker is a full-stack application designed for wildlife researchers and conservationists to track and monitor animal movements, behaviors, and health status in real-time. The system consists of:

- **API Backend**: Node.js/Express service for telemetry data ingestion and processing
- **Web Dashboard**: Next.js frontend for data visualization and monitoring
- **Kafka Integration**: Real-time data streaming capabilities
- **Docker Support**: Containerized deployment for easy setup

## 🏗️ Architecture

```
wildtracker/
├── wildtracker-api/          # Backend API service
│   ├── src/
│   │   ├── controllers/      # API endpoints
│   │   ├── models/          # Data validation
│   │   ├── routes/          # Route definitions
│   │   ├── services/        # Business logic
│   │   └── utils/           # Utilities
│   └── tests/               # API tests
└── wildtracker-web/         # Frontend dashboard
    ├── app/                 # Next.js app directory
    ├── components/          # React components
    ├── services/           # API client
    └── types/              # TypeScript definitions
```

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- npm or yarn

### Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd wildtracker
   ```

2. **Start the entire system**
   ```bash
   docker-compose up -d
   ```

3. **Access the applications**
   - Web Dashboard: http://localhost:3000
   - API Documentation: http://localhost:3001/api/v1/telemetry/stats

### Local Development

1. **Start the API backend**
   ```bash
   cd wildtracker-api
   npm install
   npm run dev
   ```

2. **Start the web frontend**
   ```bash
   cd wildtracker-web
   npm install
   npm run dev
   ```

## 📊 Features

### API Backend (`wildtracker-api`)

- **Real-time Telemetry Ingestion**: Collect GPS, sensor, and wildlife data
- **Batch Processing**: Handle multiple data points efficiently
- **Data Validation**: Comprehensive input validation and sanitization
- **Kafka Integration**: Stream data to message queues for real-time processing
- **RESTful API**: Clean, documented endpoints for data access
- **Health Monitoring**: Built-in health checks and monitoring

**Key Endpoints:**
- `POST /api/v1/telemetry` - Upload single telemetry point
- `POST /api/v1/telemetry/batch` - Upload batch telemetry data
- `GET /api/v1/telemetry/data` - Retrieve filtered telemetry data
- `GET /api/v1/telemetry/wildlife` - Get wildlife summary statistics
- `GET /api/v1/telemetry/map` - Get map visualization data
- `GET /api/v1/telemetry/individual/:id` - Get individual animal tracking

### Web Dashboard (`wildtracker-web`)

- **Interactive Map**: Real-time wildlife location visualization
- **Dashboard Analytics**: Population statistics and health monitoring
- **Individual Tracking**: Detailed animal movement history
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Updates**: Live data refresh capabilities

## 🧪 Testing

### API Tests
```bash
cd wildtracker-api
npm test                    # Run all tests
npm run test:integration    # Run integration tests
npm run test:performance    # Run performance tests
```

### Web Tests
```bash
cd wildtracker-web
npm test                    # Run unit tests
npm run test:e2e           # Run end-to-end tests
```

## 📈 Data Flow

1. **Data Collection**: GPS collars and sensors collect wildlife data
2. **API Ingestion**: Data is sent to the API via HTTP endpoints
3. **Validation**: Input data is validated and sanitized
4. **Kafka Streaming**: Validated data is streamed to Kafka topics
5. **Storage**: Data is stored in the database (PostgreSQL in production)
6. **Visualization**: Web dashboard queries and displays the data
7. **Analytics**: Real-time analytics and alerts are generated

## 🔧 Configuration

### Environment Variables

**API Backend** (`wildtracker-api/.env`):
```env
NODE_ENV=development
PORT=3001
KAFKA_BROKERS=localhost:9092
KAFKA_TOPIC=wildlife-telemetry
LOG_LEVEL=info
```

**Web Frontend** (`wildtracker-web/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
```

## 🐳 Docker Deployment

The project includes Docker configurations for easy deployment:

- **Development**: `docker-compose.yml` for local development
- **Production**: Separate production Dockerfiles with optimized builds
- **Multi-stage builds**: Optimized image sizes for production

## 📚 API Documentation

### Telemetry Data Format

```json
{
  "deviceId": "wolf-collar-001",
  "timestamp": "2024-01-15T10:30:00Z",
  "location": {
    "latitude": 53.9169,
    "longitude": -122.7494,
    "altitude": 850,
    "accuracy": 5.2
  },
  "wildlife": {
    "species": "Gray Wolf",
    "individualId": "wolf-alpha-001",
    "activity": "active",
    "health": "healthy"
  },
  "sensors": {
    "temperature": 15.5,
    "humidity": 65,
    "battery": 85
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the [API documentation](wildtracker-api/README.md)
- Review the [testing guide](wildtracker-api/TESTING.md)

## 🔮 Roadmap

- [ ] Real-time alerts and notifications
- [ ] Machine learning for behavior prediction
- [ ] Mobile app for field researchers
- [ ] Advanced analytics dashboard
- [ ] Integration with external wildlife databases
- [ ] Weather data correlation
- [ ] Population modeling tools 