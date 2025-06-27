import { apiService } from '@/services/api'
import { TelemetryData, WildlifeSummary } from '@/types/telemetry'

// Mock fetch globally
global.fetch = jest.fn()

// Suppress console.error in tests
const originalError = console.error
beforeAll(() => {
  console.error = jest.fn()
})

afterAll(() => {
  console.error = originalError
})

describe('ApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getMapData', () => {
    it('should fetch map data successfully', async () => {
      // Arrange - Define expected behavior first (TDD Red phase)
      const mockTelemetryData: TelemetryData[] = [
        {
          deviceId: 'device-1',
          timestamp: '2024-01-01T00:00:00Z',
          location: { latitude: 37.7749, longitude: -122.4194 },
          wildlife: {
            species: 'Gray Wolf',
            individualId: 'wolf-001',
            activity: 'active',
            health: 'healthy'
          }
        }
      ]

      const mockResponse = {
        success: true,
        data: mockTelemetryData
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      // Act
      const result = await apiService.getMapData(100)

      // Assert
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/telemetry/map?limit=100'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      )
      expect(result).toEqual(mockTelemetryData)
    })

    it('should handle API errors gracefully', async () => {
      // Arrange
      const mockResponse = {
        success: false,
        error: 'Failed to fetch data'
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      // Act & Assert
      await expect(apiService.getMapData()).rejects.toThrow('Failed to fetch data')
    })

    it('should handle network errors', async () => {
      // Arrange
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      // Act & Assert
      await expect(apiService.getMapData()).rejects.toThrow('Network error')
    })

    it('should handle HTTP error responses', async () => {
      // Arrange
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      // Act & Assert
      await expect(apiService.getMapData()).rejects.toThrow('HTTP error! status: 500')
    })
  })

  describe('getWildlifeSummary', () => {
    it('should fetch wildlife summary successfully', async () => {
      // Arrange
      const mockSummary: WildlifeSummary = {
        totalIndividuals: 50,
        activeDevices: 45,
        species: [
          { name: 'Gray Wolf', count: 20, active: 18 },
          { name: 'Brown Bear', count: 15, active: 14 },
          { name: 'White-tailed Deer', count: 15, active: 13 }
        ],
        speciesBreakdown: {
          'Gray Wolf': 20,
          'Brown Bear': 15,
          'White-tailed Deer': 15
        },
        activityBreakdown: {
          'active': 30,
          'resting': 15,
          'hunting': 5
        },
        healthStatus: {
          'healthy': 45,
          'injured': 3,
          'sick': 2
        },
        recentAlerts: [
          {
            id: 'alert-1',
            deviceId: 'device-1',
            type: 'low_battery',
            timestamp: '2024-01-01T00:00:00Z',
            severity: 'warning'
          }
        ],
        timestamp: '2024-01-01T00:00:00Z'
      }

      const mockResponse = {
        success: true,
        data: mockSummary
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      // Act
      const result = await apiService.getWildlifeSummary()

      // Assert
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/telemetry/wildlife'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      )
      expect(result).toEqual(mockSummary)
    })
  })

  describe('getTelemetryData', () => {
    it('should fetch telemetry data with pagination', async () => {
      // Arrange
      const mockResponse = {
        success: true,
        data: {
          data: [],
          pagination: {
            limit: 10,
            offset: 0,
            total: 100,
            hasMore: true
          }
        }
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      // Act
      const result = await apiService.getTelemetryData({
        limit: 10,
        offset: 0,
        species: 'Gray Wolf'
      })

      // Assert
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/telemetry/data?limit=10&species=Gray+Wolf'),
        expect.any(Object)
      )
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('uploadTelemetry', () => {
    it('should upload telemetry data successfully', async () => {
      // Arrange
      const telemetryData = {
        deviceId: 'device-1',
        timestamp: '2024-01-01T00:00:00Z',
        location: { latitude: 37.7749, longitude: -122.4194 }
      }

      const mockResponse = {
        success: true,
        data: {
          id: 'telemetry-1',
          timestamp: '2024-01-01T00:00:00Z',
          partition: 0,
          offset: 123
        }
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      // Act
      const result = await apiService.uploadTelemetry(telemetryData)

      // Assert
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/telemetry'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(telemetryData),
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      )
      expect(result).toEqual(mockResponse.data)
    })
  })
}) 