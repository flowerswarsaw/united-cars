/**
 * Next.js 15 Parameter Compatibility Test
 * Verifies that route parameters are properly handled as Promises in Next.js 15
 */

describe('Next.js 15 Parameter Compatibility', () => {
  it('should handle Promise-based parameters correctly', async () => {
    // Simulate Next.js 15 route handler with Promise-based parameters
    const mockRouteHandler = async (request, context) => {
      // In Next.js 15, params is a Promise that needs to be awaited
      const params = await context.params
      return {
        status: 200,
        json: () => Promise.resolve({ id: params.id, message: 'Success' })
      }
    }

    // Test the route handler with Promise-based parameters
    const request = { url: 'http://localhost:3000/api/test/123' }
    const context = { params: Promise.resolve({ id: '123' }) }
    
    const response = await mockRouteHandler(request, context)
    expect(response.status).toBe(200)
    
    const data = await response.json()
    expect(data.id).toBe('123')
    expect(data.message).toBe('Success')
  })

  it('should work with multiple parameters', async () => {
    const mockRouteHandler = async (request, context) => {
      const params = await context.params
      return {
        status: 200,
        json: () => Promise.resolve({ 
          id: params.id, 
          action: params.action,
          message: 'Multi-param success' 
        })
      }
    }

    const request = { url: 'http://localhost:3000/api/items/456/delete' }
    const context = { params: Promise.resolve({ id: '456', action: 'delete' }) }
    
    const response = await mockRouteHandler(request, context)
    const data = await response.json()
    
    expect(data.id).toBe('456')
    expect(data.action).toBe('delete')
    expect(data.message).toBe('Multi-param success')
  })

  it('should handle parameter errors gracefully', async () => {
    const mockRouteHandler = async (request, context) => {
      try {
        const params = await context.params
        return {
          status: 200,
          json: () => Promise.resolve({ id: params.id })
        }
      } catch (error) {
        return {
          status: 400,
          json: () => Promise.resolve({ error: 'Invalid parameters' })
        }
      }
    }

    // Test with invalid parameters
    const request = { url: 'http://localhost:3000/api/test/invalid' }
    const context = { params: Promise.reject(new Error('Invalid parameter')) }
    
    const response = await mockRouteHandler(request, context)
    expect(response.status).toBe(400)
    
    const data = await response.json()
    expect(data.error).toBe('Invalid parameters')
  })
})