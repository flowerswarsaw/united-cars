'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TrendingUp, Car } from 'lucide-react'

// Check if CRM demo mode is enabled
const isCRMDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'crm'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  // Pre-fill demo credentials in CRM demo mode
  useEffect(() => {
    if (isCRMDemoMode) {
      setEmail('admin@unitedcars.com')
      setPassword('admin123')
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        // Redirect to CRM in demo mode, dashboard otherwise
        router.push(isCRMDemoMode ? '/crm' : '/dashboard')
      } else {
        setError(data.error || 'Login failed')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 ${
      isCRMDemoMode
        ? 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900'
        : 'bg-gray-50'
    }`}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl ${
              isCRMDemoMode
                ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
                : 'bg-blue-600'
            }`}>
              {isCRMDemoMode ? (
                <TrendingUp className="w-9 h-9 text-white" />
              ) : (
                <Car className="w-9 h-9 text-white" />
              )}
            </div>
          </div>
          <h2 className={`text-3xl font-bold ${isCRMDemoMode ? 'text-white' : 'text-gray-900'}`}>
            {isCRMDemoMode ? 'SalesPro CRM' : 'Sign in to United Cars'}
          </h2>
          <p className={`mt-2 text-sm ${isCRMDemoMode ? 'text-indigo-200' : 'text-gray-600'}`}>
            {isCRMDemoMode
              ? 'Modern Sales Pipeline Management'
              : 'Enter your credentials to access your account'}
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className={`py-8 px-4 shadow-xl sm:rounded-xl sm:px-10 ${
          isCRMDemoMode
            ? 'bg-white/10 backdrop-blur-lg border border-white/20'
            : 'bg-white'
        }`}>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className={`block text-sm font-medium ${
                isCRMDemoMode ? 'text-indigo-100' : 'text-gray-700'
              }`}>
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`appearance-none block w-full px-4 py-3 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 sm:text-sm ${
                    isCRMDemoMode
                      ? 'bg-white/10 border-white/30 text-white focus:ring-indigo-400 focus:border-indigo-400'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="admin@unitedcars.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className={`block text-sm font-medium ${
                isCRMDemoMode ? 'text-indigo-100' : 'text-gray-700'
              }`}>
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`appearance-none block w-full px-4 py-3 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 sm:text-sm ${
                    isCRMDemoMode
                      ? 'bg-white/10 border-white/30 text-white focus:ring-indigo-400 focus:border-indigo-400'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="admin123"
                />
              </div>
            </div>

            {error && (
              <div className={`text-sm p-3 rounded-lg ${
                isCRMDemoMode
                  ? 'text-red-200 bg-red-500/20'
                  : 'text-red-600'
              }`}>{error}</div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-semibold text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
                  isCRMDemoMode
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 focus:ring-indigo-500'
                    : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                }`}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>

          {isCRMDemoMode ? (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-transparent text-indigo-200">Demo Access</span>
                </div>
              </div>

              <div className="mt-4 text-center">
                <p className="text-sm text-indigo-200">
                  Credentials are pre-filled. Click Sign in to explore.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Demo accounts</span>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <div>Admin: admin@unitedcars.com / admin123</div>
                <div>Dealer: dealer@demo.com / dealer123</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Feature highlights for CRM demo mode */}
      {isCRMDemoMode && (
        <div className="mt-12 sm:mx-auto sm:w-full sm:max-w-2xl">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-white">Pipeline</div>
              <div className="text-sm text-indigo-200">Visual deal tracking</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-white">Automation</div>
              <div className="text-sm text-indigo-200">Workflow triggers</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-white">Analytics</div>
              <div className="text-sm text-indigo-200">Real-time insights</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
