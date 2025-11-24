# CRM Data Synchronization Issue & Solution

## Problem

**Deals not appearing in Kanban board despite having `currentStages` assigned.**

### Root Cause

The CRM system uses a persistence layer that saves data to `apps/web/.crm-data/data.json`. When you:

1. Start with seed data containing pipelines with specific IDs (e.g., `'dealer-acquisition'`, `'dealer-integration'`)
2. Create or modify pipelines through the UI
3. New pipelines are created with random nanoid IDs (e.g., `'irLg-6i4WWYbqCmcenAQB'`)
4. These new pipelines get persisted, overwriting the seed pipelines
5. Deals still reference the old pipeline IDs in their `currentStages`
6. **Result**: Deals don't match any existing pipeline, so they don't appear in the Kanban

### Example of the Mismatch

**Seed Data (deals-seed.ts):**
```typescript
deals[0].currentStages = [
  makeDealCurrentStage('deal_1', 'dealer-acquisition', 'stage_da_3')
];
```

**Persisted Data (after UI changes):**
```json
{
  "pipelines": [
    {"id": "irLg-6i4WWYbqCmcenAQB", "name": "Dealer Acquisition Copy"}
  ]
}
```

❌ `'dealer-acquisition'` !== `'irLg-6i4WWYbqCmcenAQB'` → Deal won't appear!

## Solutions

### Option 1: Reset via API (Recommended)

Call the reset endpoint to delete persisted data:

```bash
curl -X DELETE http://localhost:3000/api/crm/reset
```

Then refresh your browser.

### Option 2: Reset via Script

Run the reset script:

```bash
./scripts/reset-crm-data.sh
```

Then restart your dev server:

```bash
pnpm dev
```

### Option 3: Manual Reset

Delete the persisted data file:

```bash
rm apps/web/.crm-data/data.json
```

Then restart your dev server.

## Prevention

To prevent this issue in the future:

### 1. **Use Seed Pipeline IDs When Creating Deals**

When creating deals through the UI or API, ensure you use the correct pipeline IDs:

- `dealer-acquisition` - For dealer acquisition deals
- `dealer-integration` - For dealer integration deals (spawned after winning)
- `retail-sales` - For individual retail customer deals
- `vendor-onboarding` - For vendor/supplier deals
- `auction-integration` - For auction integration deals

### 2. **Don't Create New Pipelines in Development**

If you need to test pipeline management:
1. Make changes to the seed data in `packages/crm-mocks/src/seeds.ts`
2. Reset the CRM data
3. Restart the server

### 3. **Use the Reset Endpoint Regularly**

When switching branches or updating seed data, reset CRM data:

```bash
curl -X DELETE http://localhost:3000/api/crm/reset
```

## Technical Details

### Data Initialization Flow

1. Server starts → `packages/crm-mocks/src/index.ts` runs `initializeData()`
2. Check if `.crm-data/data.json` exists:
   - **Yes**: Load persisted data from JSON ✅ (keeps user changes)
   - **No**: Load seed data from `seeds.ts` ✅ (fresh start)
3. All API calls use the loaded data

### Why This Happens

The persistence layer is designed to preserve user changes (deals, pipelines, tasks) across server restarts. This is useful for development, but it means seed data changes won't apply if persisted data exists.

## Verification

After resetting, verify the correct pipelines are loaded:

```bash
# Check pipelines
curl http://localhost:3000/api/crm/pipelines | jq '. | length'
# Should return: 5

# Check pipeline IDs
curl http://localhost:3000/api/crm/pipelines | jq '.[].id'
# Should include:
# "dealer-acquisition"
# "dealer-integration"
# "retail-sales"
# "vendor-onboarding"
# "auction-integration"

# Check deals in dealer-acquisition
curl 'http://localhost:3000/api/crm/deals?pipeline=dealer-acquisition' | jq '. | length'
# Should return: 6 (or the number of deals in your seed data)
```

## Future Improvements

Consider implementing:

1. **Data Migration System**: Automatically update deal references when pipeline IDs change
2. **Pipeline ID Validation**: Prevent creating pipelines with IDs that conflict with seed IDs
3. **Seed Version Tracking**: Detect when seed data changes and prompt for reset
4. **Development Mode Flag**: Automatically reset data in dev mode on server start
5. **Database Migration**: Move from JSON persistence to actual database with proper foreign key constraints

## Related Files

- **Persistence**: `packages/crm-mocks/src/index.ts` - Data initialization logic
- **Seed Data**: `packages/crm-mocks/src/seeds.ts` - Pipeline and deal definitions
- **Reset API**: `apps/web/src/app/api/crm/reset/route.ts` - Reset endpoint
- **Reset Script**: `scripts/reset-crm-data.sh` - Manual reset helper
- **Deals API**: `apps/web/src/app/api/crm/deals/route.ts` - Pipeline filtering logic
- **Kanban Page**: `apps/web/src/app/crm/deals/page.tsx` - Frontend filtering (lines 651-657)

---

**Last Updated**: 2025-11-13
**Issue**: Deals not appearing in Kanban
**Status**: Resolved ✅
