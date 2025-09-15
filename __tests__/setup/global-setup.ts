import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export default async function globalSetup() {
  console.log('🚀 Starting global test setup...');

  try {
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.CRM_PERSISTENCE_TYPE = 'memory';
    process.env.LOG_LEVEL = 'error'; // Reduce noise in tests
    process.env.DISABLE_TELEMETRY = 'true';

    // Ensure test directories exist
    const testDirs = [
      'coverage',
      'test-results',
      'test-results/html',
      '__tests__/.temp'
    ];

    for (const dir of testDirs) {
      try {
        await execAsync(`mkdir -p ${dir}`);
      } catch (error) {
        // Directory might already exist
        console.warn(`Could not create directory ${dir}:`, error);
      }
    }

    // Compile TypeScript if needed
    console.log('📦 Checking TypeScript compilation...');
    
    try {
      await execAsync('pnpm typecheck', {
        cwd: process.cwd(),
        timeout: 60000
      });
      console.log('✅ TypeScript compilation successful');
    } catch (error) {
      console.error('❌ TypeScript compilation failed:', error);
      throw error;
    }

    // Initialize test database/mock systems
    console.log('🗃️ Initializing test data systems...');
    
    // Clear any existing test data
    const tempDir = path.join(process.cwd(), '__tests__', '.temp');
    try {
      await execAsync(`rm -rf ${tempDir}/*`);
    } catch (error) {
      // Ignore if directory doesn't exist
    }

    // Verify critical CRM packages are available
    console.log('🔍 Verifying CRM packages...');
    
    const criticalPackages = [
      '@united-cars/crm-core',
      '@united-cars/crm-mocks'
    ];

    for (const pkg of criticalPackages) {
      try {
        require.resolve(pkg);
        console.log(`✅ ${pkg} available`);
      } catch (error) {
        console.error(`❌ ${pkg} not found:`, error);
        throw new Error(`Critical package ${pkg} not available for testing`);
      }
    }

    // Set up performance monitoring
    const startTime = Date.now();
    global.__TEST_START_TIME__ = startTime;

    console.log('✅ Global test setup completed successfully');

  } catch (error) {
    console.error('❌ Global test setup failed:', error);
    throw error;
  }
};