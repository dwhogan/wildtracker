# Frontend Testing Guide

This document outlines the testing strategy for the WildTracker frontend, following Kent Beck's Test-Driven Development (TDD) philosophy.

## TDD Philosophy

Our testing approach follows Kent Beck's TDD cycle:

1. **Red**: Write a failing test that defines the desired behavior
2. **Green**: Write the minimum code to make the test pass
3. **Refactor**: Clean up the code while keeping tests green

## Testing Stack

- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing utilities
- **MSW (Mock Service Worker)**: API mocking
- **TypeScript**: Type-safe testing

## Project Structure

```
wildtracker-web/
├── __tests__/
│   ├── components/          # Component tests
│   ├── hooks/              # Custom hook tests
│   ├── services/           # Service layer tests
│   └── utils/              # Test utilities and helpers
├── jest.config.js          # Jest configuration
├── jest.setup.js           # Test setup and mocks
└── TESTING.md              # This file
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (TDD mode)
npm run test:tdd

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- Dashboard.test.tsx
```

## Test Categories

### 1. Unit Tests
- **Components**: Test individual React components
- **Hooks**: Test custom React hooks
- **Services**: Test API service layer
- **Utilities**: Test helper functions

### 2. Integration Tests
- **Component Integration**: Test component interactions
- **Hook Integration**: Test hook with real components
- **Service Integration**: Test API service with mocked responses

### 3. User Experience Tests
- **User Interactions**: Test user actions and responses
- **Accessibility**: Test screen reader compatibility
- **Error Handling**: Test error states and recovery

## TDD Workflow Example

### Step 1: Write Failing Test (Red)

```typescript
// Dashboard.test.tsx
describe('Dashboard', () => {
  it('should display loading state when data is loading', () => {
    render(<Dashboard loading={true} />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })
})
```

### Step 2: Implement Minimum Code (Green)

```typescript
// Dashboard.tsx
export default function Dashboard({ loading }: DashboardProps) {
  if (loading) {
    return <div>Loading...</div>
  }
  return <div>Dashboard Content</div>
}
```

### Step 3: Refactor (Refactor)

```typescript
// Dashboard.tsx
export default function Dashboard({ loading }: DashboardProps) {
  if (loading) {
    return <LoadingSpinner />
  }
  return <DashboardContent />
}
```

## Testing Best Practices

### 1. Test Behavior, Not Implementation
```typescript
// ❌ Don't test implementation details
expect(wrapper.find('.loading-spinner')).toHaveLength(1)

// ✅ Test user-visible behavior
expect(screen.getByText('Loading dashboard data...')).toBeInTheDocument()
```

### 2. Use Descriptive Test Names
```typescript
// ❌ Poor test name
it('should work', () => {})

// ✅ Descriptive test name
it('should display error message when API request fails', () => {})
```

### 3. Follow AAA Pattern
```typescript
it('should fetch data on component mount', async () => {
  // Arrange
  const mockData = createMockTelemetryData()
  mockApiService.getMapData.mockResolvedValue(mockData)

  // Act
  render(<Dashboard />)

  // Assert
  await waitFor(() => {
    expect(screen.getByText('Gray Wolf')).toBeInTheDocument()
  })
})
```

### 4. Use Test Utilities
```typescript
// Use shared test utilities for consistency
import { createMockTelemetryData, createMockWildlifeSummary } from '@/__tests__/utils/testHelpers'

const mockData = createMockTelemetryData({
  wildlife: { species: 'Custom Species' }
})
```

## Mocking Strategy

### 1. API Service Mocking
```typescript
jest.mock('@/services/api', () => ({
  apiService: {
    getMapData: jest.fn(),
    getWildlifeSummary: jest.fn(),
  },
}))
```

### 2. External Library Mocking
```typescript
// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn(() => 'Jan 01, 00:00'),
}))
```

### 3. Browser API Mocking
```typescript
// Mock fetch
global.fetch = jest.fn()

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))
```

## Test Data Management

### 1. Use Factory Functions
```typescript
export const createMockTelemetryData = (overrides = {}) => ({
  deviceId: 'device-1',
  timestamp: '2024-01-01T00:00:00Z',
  location: { latitude: 37.7749, longitude: -122.4194 },
  wildlife: {
    species: 'Gray Wolf',
    individualId: 'wolf-001',
    activity: 'active',
    health: 'healthy'
  },
  ...overrides
})
```

### 2. Use Test Constants
```typescript
export const TEST_CONSTANTS = {
  SPECIES: {
    GRAY_WOLF: 'Gray Wolf',
    BROWN_BEAR: 'Brown Bear',
  },
  ACTIVITIES: {
    ACTIVE: 'active',
    RESTING: 'resting',
  }
} as const
```

## Coverage Goals

- **Statements**: 90%
- **Branches**: 85%
- **Functions**: 90%
- **Lines**: 90%

## Common Testing Patterns

### 1. Async Testing
```typescript
it('should handle async operations', async () => {
  const { result } = renderHook(() => useTelemetryData())
  
  await waitFor(() => {
    expect(result.current.loading).toBe(false)
  })
  
  expect(result.current.telemetryData).toEqual(mockData)
})
```

### 2. User Interaction Testing
```typescript
it('should handle user clicks', () => {
  render(<Dashboard />)
  
  const button = screen.getByText('Refresh')
  fireEvent.click(button)
  
  expect(mockApiService.getMapData).toHaveBeenCalled()
})
```

### 3. Error State Testing
```typescript
it('should display error message on API failure', async () => {
  mockApiService.getMapData.mockRejectedValue(new Error('API Error'))
  
  render(<Dashboard />)
  
  await waitFor(() => {
    expect(screen.getByText('Failed to load data')).toBeInTheDocument()
  })
})
```

## Debugging Tests

### 1. Use screen.debug()
```typescript
it('should render correctly', () => {
  render(<Dashboard />)
  screen.debug() // Shows current DOM
})
```

### 2. Use waitFor with custom timeout
```typescript
await waitFor(() => {
  expect(screen.getByText('Data loaded')).toBeInTheDocument()
}, { timeout: 5000 })
```

### 3. Use jest.fn() for debugging
```typescript
const mockFn = jest.fn()
console.log('Mock calls:', mockFn.mock.calls)
```

## Continuous Integration

Tests are automatically run on:
- Pull requests
- Main branch pushes
- Release deployments

## Resources

- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Kent Beck's TDD Book](https://www.amazon.com/Test-Driven-Development-Kent-Beck/dp/0321146530)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library) 