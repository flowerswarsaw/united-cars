-- Strategic Database Indexes for United Cars
-- Optimizes common query patterns based on API usage analysis

-- === VEHICLES TABLE INDEXES ===
-- Most common query: org-scoped vehicle lists with status filtering and pagination
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_org_status_created 
ON vehicles (org_id, status, created_at DESC);

-- Vehicle search by VIN (exact and prefix matches)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_vin_gin 
ON vehicles USING gin (vin gin_trgm_ops);

-- Vehicle search by make/model (text search)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_make_model_gin 
ON vehicles USING gin ((make || ' ' || model) gin_trgm_ops);

-- Vehicle status transitions and stage tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_status_updated 
ON vehicles (status, updated_at DESC);

-- === INSURANCE CLAIMS TABLE INDEXES ===
-- Org-scoped claims with status filtering (most common claims query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_insurance_claims_org_status_created 
ON insurance_claims (org_id, status, created_at DESC);

-- Claims by vehicle (for vehicle detail pages)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_insurance_claims_vehicle_status 
ON insurance_claims (vehicle_id, status);

-- Optimistic concurrency control lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_insurance_claims_id_version 
ON insurance_claims (id, version);

-- === SERVICE REQUESTS TABLE INDEXES ===
-- Org-scoped service requests with type/status filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_requests_org_status_type 
ON service_requests (org_id, status, type, created_at DESC);

-- Service requests by vehicle
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_requests_vehicle_status 
ON service_requests (vehicle_id, status);

-- Optimistic concurrency control
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_requests_id_version 
ON service_requests (id, version);

-- === PAYMENT INTENTS TABLE INDEXES ===
-- Org-scoped payments with status filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_intents_org_status_created 
ON payment_intents (org_id, status, created_at DESC);

-- Payment method analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_intents_method_status 
ON payment_intents (method, status);

-- Optimistic concurrency control
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_intents_id_version 
ON payment_intents (id, version);

-- === INVOICES TABLE INDEXES ===
-- Org-scoped invoices with status filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_org_status_issued 
ON invoices (org_id, status, issued_at DESC NULLS LAST);

-- Invoice number lookup (business requirement)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_number_unique 
ON invoices (number);

-- === AUDIT LOG TABLE INDEXES ===
-- Entity-specific audit trails (critical for compliance)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_entity_entityid_at 
ON audit_logs (entity, entity_id, at DESC);

-- User activity tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_actor_org_at 
ON audit_logs (actor_user_id, org_id, at DESC);

-- Org-wide audit queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_org_action_at 
ON audit_logs (org_id, action, at DESC);

-- === USER & AUTHENTICATION INDEXES ===
-- User login by email (critical path)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_status 
ON users (email, status);

-- Org-based user queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_org_status 
ON users (org_id, status);

-- === VEHICLE INTAKE TABLE INDEXES ===
-- Intake workflow queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicle_intakes_org_status_created 
ON vehicle_intakes (org_id, status, created_at DESC);

-- Location-based intake queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicle_intakes_location_status 
ON vehicle_intakes (pickup_location_id, status);

-- === IDEMPOTENCY TRACKING INDEXES ===
-- Fast idempotency key lookups (critical for preventing duplicates)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_idempotency_keys_user_entity_created 
ON idempotency_keys (user_id, entity_type, created_at DESC);

-- Clean up expired idempotency keys efficiently
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_idempotency_keys_created_cleanup 
ON idempotency_keys (created_at);

-- === COMPOSITE INDEXES FOR COMPLEX QUERIES ===
-- Vehicle search with org scoping (search + filter performance)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_search_composite 
ON vehicles (org_id, status) INCLUDE (vin, make, model, year, created_at);

-- Claims workflow optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_claims_workflow_composite 
ON insurance_claims (org_id, status, version) INCLUDE (vehicle_id, updated_at);

-- Service request workflow
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_workflow_composite 
ON service_requests (org_id, type, status) INCLUDE (vehicle_id, price_usd, updated_at);

-- === ENABLE TRIGRAM EXTENSION FOR TEXT SEARCH ===
-- Required for gin_trgm_ops indexes
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- === INDEX USAGE ANALYSIS QUERIES ===
-- Run these to monitor index effectiveness:
/*
-- Check index usage
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats WHERE tablename IN ('vehicles', 'insurance_claims', 'service_requests');

-- Monitor slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements 
WHERE query LIKE '%vehicles%' OR query LIKE '%insurance_claims%'
ORDER BY mean_time DESC LIMIT 10;

-- Index size monitoring
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
*/