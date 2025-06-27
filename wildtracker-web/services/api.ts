import { TelemetryData, WildlifeSummary } from '@/types/telemetry'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: ApiResponse<T> = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'API request failed')
      }

      return data.data as T
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error)
      throw error
    }
  }

  // Telemetry API methods
  async getMapData(limit: number = 1000): Promise<TelemetryData[]> {
    return this.request<TelemetryData[]>(`/api/v1/telemetry/map?limit=${limit}`)
  }

  async getWildlifeSummary(): Promise<WildlifeSummary> {
    return this.request<WildlifeSummary>('/api/v1/telemetry/wildlife')
  }

  async getTelemetryData(params?: {
    limit?: number
    offset?: number
    species?: string
    activity?: string
    deviceId?: string
  }): Promise<{
    data: TelemetryData[]
    pagination: {
      limit: number
      offset: number
      total: number
      hasMore: boolean
    }
  }> {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.offset) searchParams.append('offset', params.offset.toString())
    if (params?.species) searchParams.append('species', params.species)
    if (params?.activity) searchParams.append('activity', params.activity)
    if (params?.deviceId) searchParams.append('deviceId', params.deviceId)

    const queryString = searchParams.toString()
    const endpoint = `/api/v1/telemetry/data${queryString ? `?${queryString}` : ''}`
    
    return this.request(endpoint)
  }

  async getIndividualTracking(individualId: string, params?: {
    startDate?: string
    endDate?: string
    limit?: number
  }): Promise<{
    individualId: string
    summary: {
      totalPoints: number
      dateRange: {
        start: string
        end: string
      }
      distance: number
      averageSpeed: number
    }
    tracking: TelemetryData[]
  }> {
    const searchParams = new URLSearchParams()
    if (params?.startDate) searchParams.append('startDate', params.startDate)
    if (params?.endDate) searchParams.append('endDate', params.endDate)
    if (params?.limit) searchParams.append('limit', params.limit.toString())

    const queryString = searchParams.toString()
    const endpoint = `/api/v1/telemetry/individual/${individualId}${queryString ? `?${queryString}` : ''}`
    
    return this.request(endpoint)
  }

  // Upload methods
  async uploadTelemetry(telemetryData: any): Promise<{
    id: string
    timestamp: string
    partition: number
    offset: number
  }> {
    return this.request('/api/v1/telemetry', {
      method: 'POST',
      body: JSON.stringify(telemetryData),
    })
  }

  async uploadBatchTelemetry(batchData: {
    deviceId: string
    batch: any[]
  }): Promise<{
    summary: {
      total: number
      successful: number
      failed: number
    }
    results: any[]
    errors?: any[]
  }> {
    return this.request('/api/v1/telemetry/batch', {
      method: 'POST',
      body: JSON.stringify(batchData),
    })
  }
}

export const apiService = new ApiService() 