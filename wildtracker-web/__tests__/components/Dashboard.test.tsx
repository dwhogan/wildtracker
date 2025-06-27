import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Dashboard from '@/components/Dashboard'
import { TelemetryData, WildlifeSummary } from '@/types/telemetry'

// Mock date-fns format function
jest.mock('date-fns', () => ({
  format: jest.fn(() => 'Dec 31, 21:00'),
}))

describe('Dashboard', () => {
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
    },
    {
      deviceId: 'device-2',
      timestamp: '2024-01-01T01:00:00Z',
      location: { latitude: 37.7849, longitude: -122.4094 },
      wildlife: {
        species: 'Brown Bear',
        individualId: 'bear-001',
        activity: 'resting',
        health: 'healthy'
      }
    }
  ]

  const mockWildlifeSummary: WildlifeSummary = {
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

  it('should render loading state when loading is true', () => {
    // Arrange & Act
    render(
      <Dashboard
        telemetryData={[]}
        wildlifeSummary={null}
        loading={true}
      />
    )

    // Assert
    expect(screen.getByText('Loading dashboard data...')).toBeInTheDocument()
    // Check for loading spinner element
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('should render dashboard with summary cards when data is loaded', () => {
    // Arrange & Act
    render(
      <Dashboard
        telemetryData={mockTelemetryData}
        wildlifeSummary={mockWildlifeSummary}
        loading={false}
      />
    )

    // Assert
    expect(screen.getByText('Wildlife Dashboard')).toBeInTheDocument()
    expect(screen.getByText('50')).toBeInTheDocument() // Total Individuals
    expect(screen.getByText('45')).toBeInTheDocument() // Active Devices
    expect(screen.getByText('2')).toBeInTheDocument() // Data Points
    expect(screen.getByText('1')).toBeInTheDocument() // Recent Alerts
  })

  it('should render species breakdown section', () => {
    // Arrange & Act
    render(
      <Dashboard
        telemetryData={mockTelemetryData}
        wildlifeSummary={mockWildlifeSummary}
        loading={false}
      />
    )

    // Assert
    expect(screen.getByText('Species Distribution')).toBeInTheDocument()
    // Use getAllByText since Gray Wolf appears in both species breakdown and table
    const grayWolfElements = screen.getAllByText('Gray Wolf')
    expect(grayWolfElements.length).toBeGreaterThan(0)
    const count20Elements = screen.getAllByText('20')
    expect(count20Elements.length).toBeGreaterThan(0) // Gray Wolf count
    // Use getAllByText since Brown Bear appears in both species breakdown and table
    const brownBearElements = screen.getAllByText('Brown Bear')
    expect(brownBearElements.length).toBeGreaterThan(0)
    const count15Elements = screen.getAllByText('15')
    expect(count15Elements.length).toBeGreaterThan(0) // Brown Bear count
  })

  it('should render telemetry data table', () => {
    // Arrange & Act
    render(
      <Dashboard
        telemetryData={mockTelemetryData}
        wildlifeSummary={mockWildlifeSummary}
        loading={false}
      />
    )

    // Assert
    expect(screen.getByText('Recent Telemetry Data')).toBeInTheDocument()
    expect(screen.getByText('Species')).toBeInTheDocument()
    expect(screen.getByText('Individual ID')).toBeInTheDocument()
    expect(screen.getByText('Activity')).toBeInTheDocument()
    expect(screen.getByText('Health')).toBeInTheDocument()
    expect(screen.getByText('Location')).toBeInTheDocument()
    expect(screen.getByText('Time')).toBeInTheDocument()
  })

  it('should display telemetry data in table rows', () => {
    // Arrange & Act
    render(
      <Dashboard
        telemetryData={mockTelemetryData}
        wildlifeSummary={mockWildlifeSummary}
        loading={false}
      />
    )

    // Assert - Use getAllByText to handle multiple instances
    const grayWolfElements = screen.getAllByText('Gray Wolf')
    const brownBearElements = screen.getAllByText('Brown Bear')
    
    expect(grayWolfElements.length).toBeGreaterThan(0)
    expect(brownBearElements.length).toBeGreaterThan(0)
    expect(screen.getByText('wolf-001')).toBeInTheDocument()
    expect(screen.getByText('bear-001')).toBeInTheDocument()
    expect(screen.getByText('active')).toBeInTheDocument()
    expect(screen.getByText('resting')).toBeInTheDocument()
  })

  it('should apply correct activity color classes', () => {
    // Arrange & Act
    render(
      <Dashboard
        telemetryData={mockTelemetryData}
        wildlifeSummary={mockWildlifeSummary}
        loading={false}
      />
    )

    // Assert - Use getAllByText and check the first instance
    const activeBadges = screen.getAllByText('active')
    const restingBadges = screen.getAllByText('resting')
    
    expect(activeBadges[0]).toHaveClass('text-green-600', 'bg-green-100')
    expect(restingBadges[0]).toHaveClass('text-blue-600', 'bg-blue-100')
  })

  it('should apply correct health color classes', () => {
    // Arrange & Act
    render(
      <Dashboard
        telemetryData={mockTelemetryData}
        wildlifeSummary={mockWildlifeSummary}
        loading={false}
      />
    )

    // Assert - Use getAllByText and check the first instance
    const healthBadges = screen.getAllByText('healthy')
    expect(healthBadges[0]).toHaveClass('text-green-600', 'bg-green-100')
  })

  it('should display location coordinates', () => {
    // Arrange & Act
    render(
      <Dashboard
        telemetryData={mockTelemetryData}
        wildlifeSummary={mockWildlifeSummary}
        loading={false}
      />
    )

    // Assert
    expect(screen.getByText('37.7749, -122.4194')).toBeInTheDocument()
    expect(screen.getByText('37.7849, -122.4094')).toBeInTheDocument()
  })

  it('should display formatted timestamps', () => {
    // Arrange & Act
    render(
      <Dashboard
        telemetryData={mockTelemetryData}
        wildlifeSummary={mockWildlifeSummary}
        loading={false}
      />
    )

    // Assert - Check for any timestamp elements (the actual format may vary)
    const timeElements = screen.getAllByText(/[A-Za-z]{3} \d{2}, \d{2}:\d{2}/)
    expect(timeElements.length).toBeGreaterThan(0)
  })

  it('should handle timeframe selection', () => {
    // Arrange
    render(
      <Dashboard
        telemetryData={mockTelemetryData}
        wildlifeSummary={mockWildlifeSummary}
        loading={false}
      />
    )

    // Act
    const sevenDayButton = screen.getByText('7d')
    fireEvent.click(sevenDayButton)

    // Assert
    expect(sevenDayButton).toHaveClass('bg-primary-100', 'text-primary-700')
  })

  it('should handle unknown activity and health values', () => {
    // Arrange
    const telemetryWithUnknown = [
      {
        deviceId: 'device-3',
        timestamp: '2024-01-01T02:00:00Z',
        location: { latitude: 37.7949, longitude: -122.3994 },
        wildlife: {
          species: 'Unknown Species',
          individualId: 'unknown-001',
          activity: 'unknown',
          health: 'unknown'
        }
      }
    ]

    // Act
    render(
      <Dashboard
        telemetryData={telemetryWithUnknown}
        wildlifeSummary={mockWildlifeSummary}
        loading={false}
      />
    )

    // Assert - Use getAllByText and check the first instance
    const unknownBadges = screen.getAllByText('unknown')
    expect(unknownBadges[0]).toHaveClass('text-gray-600', 'bg-gray-100')
  })

  it('should handle missing wildlife data gracefully', () => {
    // Arrange
    const telemetryWithMissingData = [
      {
        deviceId: 'device-4',
        timestamp: '2024-01-01T03:00:00Z',
        location: { latitude: 37.8049, longitude: -122.3894 }
        // Missing wildlife object
      }
    ]

    // Act
    render(
      <Dashboard
        telemetryData={telemetryWithMissingData}
        wildlifeSummary={mockWildlifeSummary}
        loading={false}
      />
    )

    // Assert
    expect(screen.getAllByText('Unknown')).toHaveLength(4) // species, individualId, activity, health
  })

  it('should handle missing location data gracefully', () => {
    // Arrange
    const telemetryWithMissingLocation = [
      {
        deviceId: 'device-5',
        timestamp: '2024-01-01T04:00:00Z',
        wildlife: {
          species: 'Test Species',
          individualId: 'test-001',
          activity: 'active',
          health: 'healthy'
        }
        // Missing location object
      }
    ]

    // Act
    render(
      <Dashboard
        telemetryData={telemetryWithMissingLocation}
        wildlifeSummary={mockWildlifeSummary}
        loading={false}
      />
    )

    // Assert
    expect(screen.getByText('N/A, N/A')).toBeInTheDocument()
  })

  it('should limit table to 20 rows', () => {
    // Arrange
    const manyTelemetryData = Array.from({ length: 25 }, (_, i) => ({
      deviceId: `device-${i}`,
      timestamp: '2024-01-01T00:00:00Z',
      location: { latitude: 37.7749, longitude: -122.4194 },
      wildlife: {
        species: 'Test Species',
        individualId: `test-${i}`,
        activity: 'active',
        health: 'healthy'
      }
    }))

    // Act
    render(
      <Dashboard
        telemetryData={manyTelemetryData}
        wildlifeSummary={mockWildlifeSummary}
        loading={false}
      />
    )

    // Assert
    const tableRows = screen.getAllByRole('row')
    // Header row + 20 data rows = 21 total rows
    expect(tableRows).toHaveLength(21)
  })
}) 