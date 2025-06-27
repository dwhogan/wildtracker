'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import Dashboard from '@/components/Dashboard'
import { useTelemetryData } from '@/hooks/useTelemetryData'

// Dynamically import the map component to avoid SSR issues with Leaflet
const WildlifeMap = dynamic(() => import('@/components/WildlifeMap'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full">Loading map...</div>
})

export default function Home() {
  const [activeView, setActiveView] = useState<'map' | 'dashboard'>('map')
  const [filters, setFilters] = useState({
    species: '',
    activity: '',
    health: '',
    dateRange: { start: '', end: '' }
  })

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

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        activeView={activeView} 
        onViewChange={setActiveView}
        wildlifeSummary={wildlifeSummary}
        filters={filters}
        onFiltersChange={setFilters}
      />
      
      <div className="flex-1 flex flex-col">
        <Header />
        
        <main className="flex-1 overflow-hidden">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded m-4">
              <strong>Error:</strong> {error}
              <button 
                onClick={refetch}
                className="ml-2 text-red-600 hover:text-red-800 underline"
              >
                Retry
              </button>
            </div>
          )}
          
          {activeView === 'map' ? (
            <div className="h-full relative">
              <WildlifeMap 
                telemetryData={telemetryData}
                filters={filters}
                loading={loading}
              />
            </div>
          ) : (
            <Dashboard 
              telemetryData={telemetryData}
              wildlifeSummary={wildlifeSummary}
              loading={loading}
            />
          )}
        </main>
      </div>
    </div>
  )
} 