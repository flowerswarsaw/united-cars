/**
 * Pipeline Rules Initialization
 *
 * Seeds default pipeline rules that replicate hardcoded business logic.
 * This module auto-initializes on server-side to ensure rules are available.
 */

let initialized = false;

export async function initPipelineRules() {
  if (initialized) return;

  try {
    // Import repositories and seed function
    const { pipelineRepository } = require('./repositories/pipeline-repository');
    const { ruleRepository } = require('./repositories/rule-repository');
    const { seedDefaultRules } = require('./rules-seed');

    // Wait a bit for pipelines to be seeded first
    // This is necessary because rules reference pipelines
    await new Promise(resolve => setTimeout(resolve, 100));

    // Seed default rules
    console.log('[CRM-MOCKS] Initializing pipeline rules...');
    await seedDefaultRules(pipelineRepository, ruleRepository);

    initialized = true;
    console.log('[CRM-MOCKS] ✓ Pipeline rules initialized successfully');
  } catch (error) {
    console.error('[CRM-MOCKS] Failed to initialize pipeline rules:', error);
    // Don't throw - allow app to continue even if rules fail to seed
  }
}

// Auto-initialize on server-side
if (typeof window === 'undefined') {
  // Use setTimeout to ensure this runs after other initialization
  setTimeout(() => {
    initPipelineRules().catch(err => {
      console.error('[CRM-MOCKS] Error in delayed rule initialization:', err);
    });
  }, 500);
}
