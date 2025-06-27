'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet.markercluster'
import { TelemetryData, MapFilters } from '@/types/telemetry'

// Extend Leaflet with marker cluster functionality
declare global {
  interface Window {
    L: typeof L & {
      markerClusterGroup: (options?: any) => any
    }
  }
}

interface WildlifeMapProps {
  telemetryData: TelemetryData[]
  filters: MapFilters
  loading: boolean
}

export default function WildlifeMap({ telemetryData, filters, loading }: WildlifeMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const clusterGroupRef = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Initialize map
    const map = L.map(mapRef.current, {
      center: [37.7749, -122.4194], // San Francisco area
      zoom: 10,
      zoomControl: true,
      attributionControl: true
    })

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map)

    // Initialize marker cluster group
    const clusterGroup = (L as any).markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: function(cluster: any) {
        const count = cluster.getChildCount()
        return L.divIcon({
          html: `<div class="marker-cluster">${count}</div>`,
          className: 'marker-cluster',
          iconSize: L.point(40, 40)
        })
      }
    })

    map.addLayer(clusterGroup)
    
    mapInstanceRef.current = map
    clusterGroupRef.current = clusterGroup

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!clusterGroupRef.current || !mapInstanceRef.current) return

    // Clear existing markers
    clusterGroupRef.current.clearLayers()
    markersRef.current = []

    // Filter data based on current filters
    const filteredData = telemetryData.filter(data => {
      if (filters.species && data.wildlife.species !== filters.species) return false
      if (filters.activity && data.wildlife.activity !== filters.activity) return false
      if (filters.health && data.wildlife.health !== filters.health) return false
      return true
    })

    // Create markers for filtered data
    filteredData.forEach(data => {
      const { latitude, longitude } = data.location
      const { species, individualId, activity, health } = data.wildlife

      // Create custom marker icon based on species
      const getSpeciesColor = (species: string) => {
        switch (species.toLowerCase()) {
          case 'gray wolf': return '#8B4513'
          case 'brown bear': return '#654321'
          case 'white-tailed deer': return '#DEB887'
          case 'bald eagle': return '#4169E1'
          default: return '#666666'
        }
      }

      const markerIcon = L.divIcon({
        html: `<div class="wildlife-marker" style="background-color: ${getSpeciesColor(species)}; width: 12px; height: 12px;"></div>`,
        className: 'wildlife-marker',
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      })

      const marker = L.marker([latitude, longitude], { icon: markerIcon })

      // Create popup content
      const popupContent = `
        <div class="p-2 min-w-[200px]">
          <h3 class="font-bold text-gray-900 mb-2">${species}</h3>
          <div class="space-y-1 text-sm">
            <div><strong>ID:</strong> ${individualId}</div>
            <div><strong>Activity:</strong> <span class="capitalize">${activity}</span></div>
            <div><strong>Health:</strong> <span class="capitalize">${health}</span></div>
            <div><strong>Location:</strong> ${latitude.toFixed(4)}, ${longitude.toFixed(4)}</div>
            <div><strong>Time:</strong> ${new Date(data.timestamp).toLocaleString()}</div>
            ${data.sensors?.temperature ? `<div><strong>Temp:</strong> ${data.sensors.temperature}°C</div>` : ''}
            ${data.metadata?.battery ? `<div><strong>Battery:</strong> ${data.metadata.battery}%</div>` : ''}
          </div>
        </div>
      `

      marker.bindPopup(popupContent)
      clusterGroupRef.current!.addLayer(marker)
      markersRef.current.push(marker)
    })

    // Fit map to markers if there are any
    if (filteredData.length > 0) {
      const bounds = L.latLngBounds(filteredData.map(d => [d.location.latitude, d.location.longitude]))
      mapInstanceRef.current.fitBounds(bounds, { padding: [20, 20] })
    }
  }, [telemetryData, filters])

  return (
    <div className="relative h-full">
      {loading && (
        <div className="absolute top-4 right-4 z-[1000] bg-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
            <span className="text-sm text-gray-700">Loading data...</span>
          </div>
        </div>
      )}
      
      <div ref={mapRef} className="h-full w-full" />
      
      {/* Map controls overlay */}
      <div className="absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-lg p-2">
        <div className="text-xs text-gray-600">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-wildlife-wolf"></div>
            <span>Wolf</span>
          </div>
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-wildlife-bear"></div>
            <span>Bear</span>
          </div>
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-wildlife-deer"></div>
            <span>Deer</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-wildlife-eagle"></div>
            <span>Eagle</span>
          </div>
        </div>
      </div>
    </div>
  )
} 