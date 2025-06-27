export interface Location {
  latitude: number
  longitude: number
  altitude?: number
  accuracy?: number
}

export interface Wildlife {
  species?: string
  individualId?: string
  collarId?: string
  activity?: 'active' | 'resting' | 'feeding' | 'migrating' | 'unknown'
  behavior?: string
  health?: 'healthy' | 'injured' | 'sick' | 'unknown'
  weight?: number
  age?: number
  gender?: 'male' | 'female' | 'unknown'
  habitat?: string
  territory?: string
}

export interface Sensors {
  temperature?: number
  humidity?: number
  pressure?: number
  light?: number
  sound?: number
  vibration?: number
  acceleration?: {
    x: number
    y: number
    z: number
  }
  gyroscope?: {
    x: number
    y: number
    z: number
  }
  magnetic?: {
    x: number
    y: number
    z: number
  }
}

export interface Metadata {
  version?: string
  battery?: number
  signal?: number
  firmware?: string
  model?: string
  manufacturer?: string
  custom?: Record<string, any>
}

export interface TelemetryData {
  id?: string
  deviceId: string
  timestamp: string
  location?: Location
  sensors?: Sensors
  wildlife?: Wildlife
  metadata?: Metadata
  tags?: string[]
  priority?: 'low' | 'normal' | 'high' | 'critical'
}

export interface WildlifeSummary {
  totalIndividuals: number
  activeDevices: number
  species: Array<{
    name: string
    count: number
    active: number
  }>
  speciesBreakdown: {
    [species: string]: number
  }
  activityBreakdown: {
    [activity: string]: number
  }
  healthStatus: {
    [health: string]: number
  }
  recentAlerts: Array<{
    id: string
    deviceId: string
    type: string
    timestamp: string
    severity: string
  }>
  timestamp: string
}

export interface MapFilters {
  species: string
  activity: string
  health: string
  dateRange: {
    start: string
    end: string
  }
}

export interface MapData {
  data: TelemetryData[]
  total: number
  limit: number
  offset: number
} 