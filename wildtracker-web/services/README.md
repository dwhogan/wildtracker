# API Services

This directory contains the API service layer for the WildTracker frontend application.

## Architecture

The frontend now uses a centralized API service layer instead of direct fetch calls in components. This provides:

- **Type Safety**: All API calls are properly typed with TypeScript
- **Error Handling**: Centralized error handling and response validation
- **Reusability**: API methods can be reused across components
- **Maintainability**: Easy to update API endpoints and logic in one place

## Files

### `api.ts`
The main API service class that handles all HTTP requests to the backend.

**Key Features:**
- Automatic error handling and response validation
- Type-safe method signatures
- Query parameter building
- Consistent response formatting

**Available Methods:**
- `getMapData(limit)` - Fetch telemetry data for map visualization
- `getWildlifeSummary()` - Fetch wildlife summary statistics
- `getTelemetryData(params)` - Fetch telemetry data with filtering
- `getIndividualTracking(individualId, params)` - Fetch individual animal tracking
- `uploadTelemetry(data)` - Upload single telemetry data point
- `uploadBatchTelemetry(batchData)` - Upload batch of telemetry data

## Usage

### Direct API Service Usage

```typescript
import { apiService } from '@/services/api'

// Fetch map data
const mapData = await apiService.getMapData(1000)

// Fetch wildlife summary
const summary = await apiService.getWildlifeSummary()

// Upload telemetry data
const result = await apiService.uploadTelemetry({
  deviceId: 'device-1',
  timestamp: new Date().toISOString(),
  location: { latitude: 37.7749, longitude: -122.4194 },
  wildlife: { species: 'Gray Wolf', individualId: 'wolf-1' }
})
```

### Using the Custom Hook

```typescript
import { useTelemetryData } from '@/hooks/useTelemetryData'

function MyComponent() {
  const {
    telemetryData,
    wildlifeSummary,
    loading,
    error,
    refetch
  } = useTelemetryData({
    autoRefresh: true,
    refreshInterval: 30000,
    initialLimit: 1000
  })

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      {/* Your component content */}
    </div>
  )
}
```

## Error Handling

The API service automatically handles:
- HTTP errors (non-200 responses)
- Network errors
- API response validation
- Error logging

All errors are thrown with descriptive messages that can be caught and handled by components.

## Configuration

The API base URL can be configured via the `NEXT_PUBLIC_API_URL` environment variable. If not set, it defaults to an empty string (relative URLs).

## Future Enhancements

- Request/response interceptors
- Request caching
- Retry logic for failed requests
- Request cancellation
- Request queuing
- Offline support 