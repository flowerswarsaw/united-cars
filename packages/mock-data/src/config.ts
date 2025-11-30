/**
 * Configuration for mock data layer
 * Set USE_MOCK_DATA to true to use in-memory mock database
 * Set to false to use real Prisma database
 */

export const DATA_CONFIG = {
  // Toggle this to switch between mock and real database
  USE_MOCK_DATA: process.env.USE_MOCK_DATA === 'true' || process.env.NODE_ENV === 'development',
  
  // Mock data settings
  MOCK_DELAY_MS: 100, // Simulate network delay
  MOCK_ERROR_RATE: 0, // Simulate random errors (0-1, 0 = no errors, 1 = always error)
  
  // Demo credentials
  DEMO_USERS: {
    ADMIN: { email: 'admin@unitedcars.com', password: 'admin123' },
    DEALER: { email: 'dealer@demo.com', password: 'dealer123' },
    OPS: { email: 'ops@demo.com', password: 'ops123' }
  }
};

/**
 * Helper to add artificial delay to mock operations
 */
export const mockDelay = async (ms: number = DATA_CONFIG.MOCK_DELAY_MS) => {
  if (DATA_CONFIG.USE_MOCK_DATA && ms > 0) {
    await new Promise(resolve => setTimeout(resolve, ms));
  }
};

/**
 * Helper to simulate random errors
 */
export const shouldSimulateError = (): boolean => {
  return DATA_CONFIG.USE_MOCK_DATA && Math.random() < DATA_CONFIG.MOCK_ERROR_RATE;
};