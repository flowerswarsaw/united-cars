import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🎭 Starting Playwright global setup...');

  try {
    // Set up test environment
    process.env.NODE_ENV = 'test';
    process.env.CRM_PERSISTENCE_TYPE = 'memory';

    // Launch browser for setup tasks
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    // Wait for the application to be ready
    const baseURL = config.webServer?.url || process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
    console.log(`🌐 Testing against: ${baseURL}`);

    try {
      // Wait for app to be ready
      await page.goto(`${baseURL}/api/health`, { timeout: 60000 });
      
      const healthResponse = await page.textContent('body');
      if (!healthResponse?.includes('ok')) {
        throw new Error('Application health check failed');
      }
      
      console.log('✅ Application health check passed');
    } catch (error) {
      console.error('❌ Application health check failed:', error);
      throw error;
    }

    // Set up test data via API calls
    console.log('🗃️ Setting up E2E test data...');
    
    try {
      // Initialize CRM test data
      await page.goto(`${baseURL}/crm`);
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      
      // Wait for CRM data to load
      await page.waitForSelector('[data-testid=organisations-list], [data-testid=loading-indicator]', { timeout: 30000 });
      
      console.log('✅ CRM system initialized for E2E tests');
    } catch (error) {
      console.warn('⚠️  CRM initialization may have issues:', error);
      // Don't fail setup for this - tests will handle initialization
    }

    // Create test users and sessions if needed
    console.log('👥 Setting up test user sessions...');
    
    const testUsers = [
      { email: 'admin@demo.com', role: 'admin' },
      { email: 'senior@demo.com', role: 'senior_sales_manager' },
      { email: 'junior@demo.com', role: 'junior_sales_manager' }
    ];

    for (const user of testUsers) {
      try {
        // Visit auth page to establish session
        await page.goto(`${baseURL}/auth/signin`);
        
        // Check if already signed in
        const currentUrl = page.url();
        if (currentUrl.includes('/crm') || currentUrl.includes('/dashboard')) {
          console.log(`✅ Session already active for ${user.email}`);
          continue;
        }
        
        // Fill in login form if available
        const emailField = page.locator('[data-testid=email]');
        if (await emailField.isVisible({ timeout: 5000 })) {
          await emailField.fill(user.email);
          await page.fill('[data-testid=password]', 'password123');
          await page.click('[data-testid=signin-button]');
          
          // Wait for redirect
          await page.waitForURL(url => url.includes('/crm') || url.includes('/dashboard'), { timeout: 10000 });
          console.log(`✅ Test session prepared for ${user.email}`);
        } else {
          console.log(`ℹ️  Login form not found for ${user.email}, session may already exist`);
        }
      } catch (error) {
        console.warn(`⚠️  Could not prepare session for ${user.email}:`, error);
      }
    }

    await browser.close();

    // Save setup state
    const setupState = {
      timestamp: new Date().toISOString(),
      baseURL,
      testUsers: testUsers.map(u => u.email),
      environment: 'test'
    };

    console.log('💾 Saving E2E setup state...');
    
    // In a real implementation, you might save this to a file or database
    // For now, we'll store it as a global variable
    global.__E2E_SETUP_STATE__ = setupState;

    console.log('✅ Playwright global setup completed successfully');

  } catch (error) {
    console.error('❌ Playwright global setup failed:', error);
    throw error;
  }
}

export default globalSetup;