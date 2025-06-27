# WildTracker API Testing Guide

This document outlines the comprehensive testing strategy for the WildTracker API, following Kent Beck's Test-Driven Development (TDD) principles.

## 🎯 Testing Philosophy

Our testing approach follows the **Red-Green-Refactor** cycle of TDD:

1. **Red**: Write a failing test first
2. **Green**: Write the minimum code to make the test pass
3. **Refactor**: Clean up the code while keeping tests green

## 📁 Test Structure

```
tests/
├── setup.js                    # Test environment setup
├── utils/
│   └── testHelpers.js         # Common test utilities
├── telemetry.test.js          # Original basic tests
├── telemetryController.test.js # Comprehensive unit tests
├── integration.test.js        # Full API integration tests
└── performance.test.js        # Performance and load tests
```

## 🧪 Test Categories

### 1. Unit Tests (`telemetryController.test.js`)
- **Purpose**: Test individual controller methods in isolation
- **Coverage**: All public methods of TelemetryController
- **Mocking**: External dependencies (Kafka, Logger)
- **Focus**: Business logic, validation, error handling

**Key Test Areas:**
- ✅ Telemetry data validation
- ✅ Kafka integration with fallback
- ✅ Error handling and edge cases
- ✅ Helper method functionality
- ✅ Data sanitization

### 2. Integration Tests (`integration.test.js`)
- **Purpose**: Test complete API endpoints end-to-end
- **Coverage**: All HTTP endpoints and request/response cycles
- **Mocking**: External services only
- **Focus**: API contracts, HTTP status codes, response formats

**Key Test Areas:**
- ✅ Health endpoints
- ✅ Telemetry upload (single and batch)
- ✅ Data retrieval with filtering
- ✅ Wildlife tracking endpoints
- ✅ Map data generation
- ✅ Error scenarios and edge cases

### 3. Performance Tests (`performance.test.js`)
- **Purpose**: Ensure API meets performance requirements
- **Coverage**: Load testing, stress testing, memory usage
- **Focus**: Response times, throughput, resource usage

**Key Test Areas:**
- ✅ Sequential and concurrent request handling
- ✅ Large batch processing
- ✅ Memory usage under load
- ✅ Response time consistency
- ✅ Stress testing scenarios

## 🚀 Running Tests

### Quick Start
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode (TDD style)
npm run test:tdd
```

### Advanced Test Commands
```bash
# Run specific test categories
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:performance   # Performance tests only

# Run comprehensive test suite
npm run test:all

# CI/CD testing
npm run test:ci
```

### Using the Test Runner
```bash
# Run all tests with detailed reporting
node scripts/test-runner.js all

# Run specific test suites
node scripts/test-runner.js unit
node scripts/test-runner.js integration
node scripts/test-runner.js performance

# Run in watch mode
node scripts/test-runner.js watch
```

## 📊 Test Coverage

Our test suite aims for comprehensive coverage:

- **Lines**: ≥80%
- **Functions**: ≥80%
- **Branches**: ≥80%
- **Statements**: ≥80%

### Coverage Report
After running tests with coverage, view the detailed report:
```bash
# Generate coverage report
npm run test:coverage

# View in browser
open coverage/lcov-report/index.html
```

## 🛠️ Test Utilities

### Test Helpers (`tests/utils/testHelpers.js`)

The test utilities provide common functions to reduce code duplication:

```javascript
const {
  createValidTelemetryData,
  createValidBatchData,
  createMockRequest,
  createMockResponse,
  mockKafkaService,
  assertApiResponse,
  assertTelemetryDataStructure
} = require('./utils/testHelpers');

// Create test data
const telemetryData = createValidTelemetryData({
  deviceId: 'custom-device',
  species: 'Gray Wolf'
});

// Mock Kafka service
mockKafkaService({ shouldSucceed: true });

// Assert API responses
assertApiResponse(response, true);
```

### Common Test Patterns

#### 1. Unit Test Pattern
```javascript
describe('methodName', () => {
  it('should handle valid input', async () => {
    // Arrange
    const mockReq = createMockRequest({ body: validData });
    const mockRes = createMockResponse();
    
    // Act
    await controller.methodName(mockReq, mockRes);
    
    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true
    }));
  });
});
```

#### 2. Integration Test Pattern
```javascript
describe('POST /api/v1/telemetry', () => {
  it('should upload valid telemetry data', async () => {
    // Arrange
    const validData = createValidTelemetryData();
    
    // Act
    const response = await request(app)
      .post('/api/v1/telemetry')
      .send(validData)
      .expect(201);
    
    // Assert
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
  });
});
```

#### 3. Performance Test Pattern
```javascript
describe('Performance', () => {
  it('should handle concurrent requests', async () => {
    const startTime = Date.now();
    
    const promises = testData.map(data => 
      request(app).post('/api/v1/telemetry').send(data)
    );
    
    const responses = await Promise.all(promises);
    const totalTime = Date.now() - startTime;
    
    expect(totalTime).toBeLessThan(2000);
    responses.forEach(r => expect(r.status).toBe(201));
  });
});
```

## 🔧 Test Configuration

### Jest Configuration (`jest.config.js`)
- **Environment**: Node.js
- **Setup**: Automatic test setup with `tests/setup.js`
- **Coverage**: Comprehensive coverage reporting
- **Timeout**: 10 seconds per test
- **Mocking**: Automatic mock restoration

### Test Environment (`tests/setup.js`)
- Sets `NODE_ENV=test`
- Configures test-specific environment variables
- Mocks console methods to reduce noise
- Sets up global test utilities

## 📈 Performance Benchmarks

Our performance tests ensure the API meets these requirements:

### Response Time Targets
- **Single upload**: <100ms average
- **Batch upload (100 items)**: <5 seconds
- **Data retrieval**: <500ms
- **Map data generation**: <500ms

### Throughput Targets
- **Sequential requests**: >10 req/s
- **Concurrent requests**: >20 req/s
- **Batch processing**: >10 items/second

### Resource Usage Limits
- **Memory increase**: <50MB for 100 requests
- **CPU usage**: Consistent under load
- **Error rate**: <5% under normal load

## 🐛 Debugging Tests

### Common Issues and Solutions

#### 1. Kafka Connection Errors
```javascript
// Mock Kafka service in tests
jest.mock('../src/services/kafkaService', () => ({
  sendTelemetryMessage: jest.fn().mockResolvedValue({
    partition: 0,
    offset: 12345
  })
}));
```

#### 2. Async Test Failures
```javascript
// Always await async operations
it('should handle async operation', async () => {
  const result = await controller.asyncMethod(mockReq, mockRes);
  expect(result).toBeDefined();
});
```

#### 3. Mock Cleanup
```javascript
beforeEach(() => {
  jest.clearAllMocks(); // Clear all mocks before each test
});
```

### Debug Mode
```bash
# Run tests with debug output
DEBUG=* npm test

# Run specific test with verbose output
npm test -- --verbose --testNamePattern="should upload valid telemetry"
```

## 🔄 Continuous Integration

### CI/CD Pipeline
The test suite is designed to run in CI/CD environments:

```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: |
    npm ci
    npm run test:ci
    npm run lint
```

### Pre-commit Hooks
Consider setting up pre-commit hooks to run tests automatically:

```bash
# Install husky for git hooks
npm install --save-dev husky

# Add to package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:unit && npm run lint"
    }
  }
}
```

## 📚 Best Practices

### Writing Tests
1. **Test the behavior, not the implementation**
2. **Use descriptive test names** that explain the scenario
3. **Follow the AAA pattern**: Arrange, Act, Assert
4. **Test edge cases and error conditions**
5. **Keep tests independent and isolated**

### Test Data Management
1. **Use factories** for creating test data
2. **Avoid hardcoded values** in tests
3. **Clean up test data** after each test
4. **Use realistic data** that matches production scenarios

### Performance Testing
1. **Measure what matters**: Response times, throughput, resource usage
2. **Test under realistic conditions**: Use production-like data volumes
3. **Monitor trends**: Track performance over time
4. **Set realistic thresholds**: Base targets on actual requirements

## 🎯 TDD Workflow

### 1. Write a Failing Test
```javascript
it('should validate telemetry data', () => {
  const invalidData = { /* missing required fields */ };
  expect(() => validateTelemetry(invalidData)).toThrow();
});
```

### 2. Write Minimal Code to Pass
```javascript
const validateTelemetry = (data) => {
  if (!data.deviceId) {
    throw new Error('deviceId is required');
  }
  return data;
};
```

### 3. Refactor
```javascript
const validateTelemetry = (data) => {
  const schema = Joi.object({
    deviceId: Joi.string().required()
  });
  
  const { error, value } = schema.validate(data);
  if (error) throw error;
  
  return value;
};
```

## 📞 Support

For questions about testing or to report issues:

1. Check the test output for detailed error messages
2. Review the coverage report to identify untested code
3. Consult the performance benchmarks for performance issues
4. Create an issue with test logs and reproduction steps

---

**Remember**: Good tests are the foundation of reliable software. Write tests first, keep them green, and refactor with confidence! 🚀 