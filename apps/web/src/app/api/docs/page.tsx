'use client'

import { useEffect, useState } from 'react'

export default function ApiDocsPage() {
  const [apiDocs, setApiDocs] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/docs')
      .then(res => res.json())
      .then(data => {
        setApiDocs(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading API documentation...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-red-600">Error loading documentation: {error}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">{apiDocs?.info?.title}</h1>
        <p className="text-gray-600 mb-8">{apiDocs?.info?.description}</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Overview */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold mb-4">API Information</h2>
            <div className="space-y-3">
              <div>
                <strong>Version:</strong> {apiDocs?.info?.version}
              </div>
              <div>
                <strong>Base URL:</strong>{' '}
                <code className="bg-gray-100 px-2 py-1 rounded">
                  {apiDocs?.servers?.[0]?.url}
                </code>
              </div>
              <div>
                <strong>OpenAPI:</strong> {apiDocs?.openapi}
              </div>
            </div>
          </div>

          {/* Available Endpoints */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold mb-4">Quick Links</h2>
            <div className="space-y-2">
              <a 
                href="/api/health" 
                target="_blank"
                className="block text-blue-600 hover:text-blue-800 underline"
              >
                🏥 Health Check
              </a>
              <a 
                href="/api/metrics" 
                target="_blank"
                className="block text-blue-600 hover:text-blue-800 underline"
              >
                📊 Performance Metrics
              </a>
              <a 
                href="/api/crm/organisations" 
                target="_blank"
                className="block text-blue-600 hover:text-blue-800 underline"
              >
                🏢 Organizations API
              </a>
              <a 
                href="/api/crm/deals" 
                target="_blank"
                className="block text-blue-600 hover:text-blue-800 underline"
              >
                💼 Deals API
              </a>
            </div>
          </div>
        </div>

        {/* Tags/Categories */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">API Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {apiDocs?.tags?.map((tag: any) => (
              <div key={tag.name} className="border rounded p-4">
                <h3 className="font-semibold text-lg">{tag.name}</h3>
                <p className="text-gray-600 text-sm mt-1">{tag.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Endpoints */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Available Endpoints</h2>
          <div className="space-y-4">
            {Object.entries(apiDocs?.paths || {}).map(([path, methods]: [string, any]) => (
              <div key={path} className="border rounded p-4">
                <h3 className="font-mono text-lg font-semibold mb-2">{path}</h3>
                <div className="space-y-2">
                  {Object.entries(methods).map(([method, details]: [string, any]) => (
                    <div key={method} className="flex items-center gap-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${
                        method === 'get' ? 'bg-green-100 text-green-800' :
                        method === 'post' ? 'bg-blue-100 text-blue-800' :
                        method === 'patch' ? 'bg-yellow-100 text-yellow-800' :
                        method === 'delete' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {method}
                      </span>
                      <span className="text-gray-700">{details.summary}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* OpenAPI JSON */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">OpenAPI Specification</h2>
          <p className="text-gray-600 mb-4">
            You can import this OpenAPI specification into tools like Postman, Insomnia, or Swagger UI.
          </p>
          <a 
            href="/api/docs" 
            target="_blank"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            View OpenAPI JSON
          </a>
        </div>
      </div>
    </div>
  )
}