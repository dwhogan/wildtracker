'use client'

import { MapPin, Activity, Users, Clock } from 'lucide-react'

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <MapPin className="h-8 w-8 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">WildTracker</h1>
          </div>
          <div className="hidden md:flex items-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-green-500" />
              <span>Live Tracking</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span>Wildlife Monitoring</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{new Date().toLocaleTimeString()}</span>
          </div>
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
        </div>
      </div>
    </header>
  )
} 