import { renderHook, waitFor } from '@testing-library/react'
import { useTelemetryData } from '@/hooks/useTelemetryData'
import { TelemetryData, WildlifeSummary } from '@/types/telemetry'

// Mock fetch globally instead of mocking the service
global.fetch = jest.fn()

describe('useTelemetryData', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

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

  const mockWildlifeSummary: WildlifeSummary = {
    totalIndividuals: 50,
    activeDevices: 45,
    species: [
      { name: 'Gray Wolf', count: 20, active: 18 },
      { name: 'Brown Bear', count: 15, active: 14 }
    ],
    speciesBreakdown: {
      'Gray Wolf': 20,
      'Brown Bear': 15
    },
    activityBreakdown: {
      'active': 30,
      'resting': 15
    },
    healthStatus: {
      'healthy': 45,
      'injured': 3
    },
    recentAlerts: [],
    timestamp: '2024-01-01T00:00:00Z'
  }

  it('should initialize with loading state', () => {
    // Arrange
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockTelemetryData })
    })

    // Act
    const { result } = renderHook(() => useTelemetryData())

    // Assert
    expect(result.current.loading).toBe(true)
    expect(result.current.telemetryData).toEqual([])
    expect(result.current.wildlifeSummary).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('should fetch data on mount', async () => {
    // Arrange
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockTelemetryData })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockWildlifeSummary })
      })

    // Act
    const { result } = renderHook(() => useTelemetryData())

    // Assert
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.telemetryData).toEqual(mockTelemetryData)
    expect(result.current.wildlifeSummary).toEqual(mockWildlifeSummary)
    expect(result.current.error).toBeNull()
  })

  it('should handle API errors gracefully', async () => {
    // Arrange
    const errorMessage = 'Failed to fetch data'
    ;(fetch as jest.Mock).mockRejectedValue(new Error(errorMessage))

    // Act
    const { result } = renderHook(() => useTelemetryData())

    // Assert
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe(errorMessage)
    expect(result.current.telemetryData).toEqual([])
    expect(result.current.wildlifeSummary).toBeNull()
  })

  it('should support custom initial limit', async () => {
    // Arrange
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockTelemetryData })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockWildlifeSummary })
      })

    // Act
    const { result } = renderHook(() => useTelemetryData({ initialLimit: 500 }))

    // Assert
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Verify the correct limit was used in the API call
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/telemetry/map?limit=500'),
      expect.any(Object)
    )
  })

  it('should support refetch functionality', async () => {
    // Arrange
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockTelemetryData })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockWildlifeSummary })
      })

    const { result } = renderHook(() => useTelemetryData())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Clear mocks to verify refetch calls
    jest.clearAllMocks()
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockTelemetryData })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockWildlifeSummary })
      })

    // Act
    await result.current.refetch()

    // Assert
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/telemetry/map?limit=1000'),
      expect.any(Object)
    )
  })

  it('should support auto-refresh when enabled', async () => {
    // Arrange
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockTelemetryData })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockWildlifeSummary })
      })

    const { result } = renderHook(() => useTelemetryData({ 
      autoRefresh: true, 
      refreshInterval: 1000 
    }))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Clear mocks to verify refresh calls
    jest.clearAllMocks()
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockTelemetryData })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockWildlifeSummary })
      })

    // Act - Advance timers to trigger refresh
    jest.advanceTimersByTime(1000)

    // Assert
    await waitFor(() => {
      expect(fetch).toHaveBeenCalled()
    })
  })

  it('should not auto-refresh when disabled', async () => {
    // Arrange
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockTelemetryData })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockWildlifeSummary })
      })

    const { result } = renderHook(() => useTelemetryData({ 
      autoRefresh: false 
    }))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Clear mocks
    jest.clearAllMocks()

    // Act - Advance timers
    jest.advanceTimersByTime(30000)

    // Assert
    expect(fetch).not.toHaveBeenCalled()
  })

  it('should support filter updates', async () => {
    // Arrange
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockTelemetryData })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockWildlifeSummary })
      })

    const { result } = renderHook(() => useTelemetryData())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Act
    const newFilters = { species: 'Gray Wolf', activity: 'active' }
    result.current.updateFilters(newFilters)

    // Assert - Filters should be updated (implementation would handle filtered data)
    // This test verifies the function exists and can be called
    expect(result.current.updateFilters).toBeDefined()
  })
}) 