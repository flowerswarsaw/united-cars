// Debug script to check what's actually exported from crm-core
try {
  const crmCore = require('./packages/crm-core/src/index.ts');
  console.log('Available exports from crm-core:');
  console.log(Object.keys(crmCore).filter(key => key.includes('Organisation') || key.includes('Type')));
  
  // Check if OrganisationType exists
  if (crmCore.OrganisationType) {
    console.log('OrganisationType found:', crmCore.OrganisationType);
  } else {
    console.log('OrganisationType NOT found');
  }
  
  // Check types specifically
  const types = require('./packages/crm-core/src/types.ts');
  console.log('Available exports from types.ts:');
  console.log(Object.keys(types).filter(key => key.includes('Organisation') || key.includes('Type')));
  
} catch (error) {
  console.error('Error:', error.message);
}