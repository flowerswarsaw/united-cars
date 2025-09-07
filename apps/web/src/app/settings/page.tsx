'use client'

import { useState, useEffect } from 'react'
import { useSession } from '@/hooks/useSession'

interface UserSettings {
  defaultInsurance: string
  defaultUsPort: string | null
  defaultDestinationPort: string | null
}

const US_PORTS = [
  'NY - New York',
  'GA - Georgia', 
  'Los Angeles',
  'New Jersey',
  'FL - Florida',
  'TX - Texas'
]

const DESTINATION_PORTS = [
  'Batumi',
  'Poti', 
  'Odessa',
  'Constanta',
  'Hamburg',
  'Antwerp'
]

export default function SettingsPage() {
  const { user, loading } = useSession()
  const [settings, setSettings] = useState<UserSettings>({
    defaultInsurance: '1%',
    defaultUsPort: null,
    defaultDestinationPort: null
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    if (user) {
      loadSettings()
    }
  }, [user])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/user/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = async () => {
    setIsSaving(true)
    setMessage(null)
    
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' })
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  if (loading || isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-48 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-300 rounded w-32"></div>
            <div className="h-10 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">User Settings</h1>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Default Values for Vehicle Intakes</h2>
        
        {message && (
          <div className={`mb-4 p-3 rounded-md ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Insurance
            </label>
            <select
              value={settings.defaultInsurance}
              onChange={(e) => setSettings({ ...settings, defaultInsurance: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1%">1%</option>
              <option value="2%">2%</option>
              <option value="no">No Insurance</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default US Port
            </label>
            <select
              value={settings.defaultUsPort || ''}
              onChange={(e) => setSettings({ ...settings, defaultUsPort: e.target.value || null })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a port...</option>
              {US_PORTS.map(port => (
                <option key={port} value={port}>{port}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Destination Port
            </label>
            <select
              value={settings.defaultDestinationPort || ''}
              onChange={(e) => setSettings({ ...settings, defaultDestinationPort: e.target.value || null })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a port...</option>
              {DESTINATION_PORTS.map(port => (
                <option key={port} value={port}>{port}</option>
              ))}
            </select>
          </div>

          <div className="pt-4">
            <button
              onClick={saveSettings}
              disabled={isSaving}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}