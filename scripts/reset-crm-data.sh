#!/bin/bash

# Reset CRM Data Script
# This script deletes the persisted CRM data and forces the system to reload from seed data

echo "🔄 Resetting CRM data to seed state..."

# Path to the persisted data file
DATA_FILE="./apps/web/.crm-data/data.json"

if [ -f "$DATA_FILE" ]; then
    rm "$DATA_FILE"
    echo "✅ Deleted persisted data file: $DATA_FILE"
    echo "📦 CRM will reload from seed data on next server start"
else
    echo "ℹ️  No persisted data found - already using seed data"
fi

echo ""
echo "To apply changes:"
echo "  1. Restart your development server (Ctrl+C then 'pnpm dev')"
echo "  2. Or call: curl -X DELETE http://localhost:3000/api/crm/reset"
echo ""
