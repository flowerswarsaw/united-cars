#!/usr/bin/env node

// Debug script to test CRM deal repository
const path = require('path');

// Import the repository
const { dealRepository } = require('./packages/crm-mocks/dist/index.js');

async function debugDeals() {
  try {
    console.log('Testing deal repository...');

    const deals = await dealRepository.list();
    console.log(`Found ${deals.length} deals:`);

    deals.forEach((deal, index) => {
      console.log(`${index + 1}. ${deal.title} (${deal.id}) - Stage: ${deal.stageId}, Pipeline: ${deal.pipelineId}`);
    });

    if (deals.length === 0) {
      console.log('❌ No deals found in repository');
    } else {
      console.log('✅ Deals loaded successfully');
    }

  } catch (error) {
    console.error('❌ Error testing deal repository:', error);
  }
}

debugDeals();