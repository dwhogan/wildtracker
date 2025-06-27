'use client'

import { useState } from 'react'
import { Map, BarChart3, Filter, RefreshCw, Eye, EyeOff } from 'lucide-react'
import { WildlifeSummary, MapFilters } from '@/types/telemetry'

interface SidebarProps {
  activeView: 'map' | 'dashboard'
  onViewChange: (view: 'map' | 'dashboard') => void
  wildlifeSummary: WildlifeSummary | null
  filters: MapFilters
  onFiltersChange: (filters: MapFilters) => void
}

export default function Sidebar({ 
  activeView, 
  onViewChange, 
  wildlifeSummary, 
  filters, 
  onFiltersChange 
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleFilterChange = (key: keyof MapFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  return (
    <div className={`bg-white shadow-lg border-r border-gray-200 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-80'
    }`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && <h2 className="text-lg font-semibold text-gray-900">Controls</h2>}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {isCollapsed ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Navigation */}
        <div className="space-y-2">
          <button
            onClick={() => onViewChange('map')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
              activeView === 'map' 
                ? 'bg-primary-100 text-primary-700' 
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <Map className="h-5 w-5" />
            {!isCollapsed && <span>Map View</span>}
          </button>
          
          <button
            onClick={() => onViewChange('dashboard')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
              activeView === 'dashboard' 
                ? 'bg-primary-100 text-primary-700' 
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <BarChart3 className="h-5 w-5" />
            {!isCollapsed && <span>Dashboard</span>}
          </button>
        </div>

        {!isCollapsed && (
          <>
            {/* Filters */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-600" />
                <h3 className="text-sm font-medium text-gray-900">Filters</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Species
                  </label>
                  <select
                    value={filters.species}
                    onChange={(e) => handleFilterChange('species', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">All Species</option>
                    <option value="Gray Wolf">Gray Wolf</option>
                    <option value="Brown Bear">Brown Bear</option>
                    <option value="White-tailed Deer">White-tailed Deer</option>
                    <option value="Bald Eagle">Bald Eagle</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Activity
                  </label>
                  <select
                    value={filters.activity}
                    onChange={(e) => handleFilterChange('activity', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">All Activities</option>
                    <option value="active">Active</option>
                    <option value="resting">Resting</option>
                    <option value="hunting">Hunting</option>
                    <option value="migrating">Migrating</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Health Status
                  </label>
                  <select
                    value={filters.health}
                    onChange={(e) => handleFilterChange('health', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">All Health</option>
                    <option value="healthy">Healthy</option>
                    <option value="injured">Injured</option>
                    <option value="sick">Sick</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Wildlife Summary */}
            {wildlifeSummary && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <RefreshCw className="h-4 w-4 text-gray-600" />
                  <h3 className="text-sm font-medium text-gray-900">Summary</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {wildlifeSummary.totalIndividuals}
                    </div>
                    <div className="text-xs text-blue-700">Total Individuals</div>
                  </div>
                  
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {wildlifeSummary.activeDevices}
                    </div>
                    <div className="text-xs text-green-700">Active Devices</div>
                  </div>
                </div>

                {/* Species Breakdown */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-gray-700">Species</h4>
                  {wildlifeSummary.speciesBreakdown && Object.entries(wildlifeSummary.speciesBreakdown).map(([species, count]) => (
                    <div key={species} className="flex justify-between text-xs">
                      <span className="text-gray-600">{species}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
} 