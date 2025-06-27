import { useState, useEffect, useCallback } from 'react'
import { TelemetryData, WildlifeSummary } from '@/types/telemetry'
import { apiService } from '@/services/api'

interface UseTelemetryDataOptions {
  autoRefresh?: boolean
  refreshInterval?: number
  initialLimit?: number
}

interface UseTelemetryDataReturn {
  telemetryData: TelemetryData[]
  wildlifeSummary: WildlifeSummary | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  updateFilters: (filters: any) => void
}

export function useTelemetryData(options: UseTelemetryDataOptions = {}): UseTelemetryDataReturn {
  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds
    initialLimit = 1000
  } = options

  const [telemetryData, setTelemetryData] = useState<TelemetryData[]>([])
  const [wildlifeSummary, setWildlifeSummary] = useState<WildlifeSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({})

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch map data and wildlife summary in parallel
      const [mapData, summaryData] = await Promise.all([
        apiService.getMapData(initialLimit),
        apiService.getWildlifeSummary()
      ])
      
      setTelemetryData(mapData)
      setWildlifeSummary(summaryData)
    } catch (err) {
      console.error('Error fetching telemetry data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }, [initialLimit])

  const refetch = useCallback(async () => {
    await fetchData()
  }, [fetchData])

  const updateFilters = useCallback((newFilters: any) => {
    setFilters(newFilters)
    // You could implement filtered data fetching here
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(fetchData, refreshInterval)
    return () => clearInterval(interval)
  }, [fetchData, autoRefresh, refreshInterval])

  return {
    telemetryData,
    wildlifeSummary,
    loading,
    error,
    refetch,
    updateFilters
  }
} 