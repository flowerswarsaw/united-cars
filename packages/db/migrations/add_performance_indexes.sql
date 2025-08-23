-- Migration: Add Performance Indexes
-- Sprint 2.7: Database Performance Optimization
-- Date: 2025-08-23

BEGIN;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- === HIGH PRIORITY INDEXES (Most Common Query Patterns) ===

-- 1. Vehicles: Org-scoped lists with status filtering and pagination
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_org_status_created 
ON vehicles (org_id, status, created_at DESC);

-- 2. Insurance Claims: Org-scoped with status filtering  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_insurance_claims_org_status_created 
ON insurance_claims (org_id, status, created_at DESC);

-- 3. Service Requests: Org-scoped with type/status filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_requests_org_status_type 
ON service_requests (org_id, status, type, created_at DESC);

-- 4. Payment Intents: Org-scoped with status filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_intents_org_status_created 
ON payment_intents (org_id, status, created_at DESC);

-- 5. Audit Logs: Entity-specific trails (compliance critical)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_entity_entityid_at 
ON audit_logs (entity, entity_id, at DESC);

-- === OPTIMISTIC CONCURRENCY CONTROL INDEXES ===

-- Fast version checks for concurrent updates
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_insurance_claims_id_version 
ON insurance_claims (id, version);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_requests_id_version 
ON service_requests (id, version);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_intents_id_version 
ON payment_intents (id, version);

-- === AUTHENTICATION & USER INDEXES ===

-- User login optimization (critical path)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_status 
ON users (email, status);

-- Org-based user queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_org_status 
ON users (org_id, status);

-- === SEARCH & TEXT INDEXES ===

-- Vehicle VIN search (exact and prefix)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_vin_gin 
ON vehicles USING gin (vin gin_trgm_ops);

-- Vehicle make/model search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_make_model_gin 
ON vehicles USING gin ((make || ' ' || model) gin_trgm_ops);

-- === FOREIGN KEY RELATIONSHIP INDEXES ===

-- Claims by vehicle (vehicle detail pages)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_insurance_claims_vehicle_status 
ON insurance_claims (vehicle_id, status);

-- Service requests by vehicle
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_requests_vehicle_status 
ON service_requests (vehicle_id, status);

-- === BUSINESS LOGIC INDEXES ===

-- Invoice number lookup (business requirement)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_number_unique 
ON invoices (number);

-- Org-scoped invoices with status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_org_status_issued 
ON invoices (org_id, status, issued_at DESC NULLS LAST);

-- === IDEMPOTENCY SYSTEM INDEXES ===

-- Fast idempotency key lookups (prevent duplicates)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_idempotency_keys_user_entity_created 
ON idempotency_keys (user_id, entity_type, created_at DESC);

-- Efficient cleanup of expired keys
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_idempotency_keys_created_cleanup 
ON idempotency_keys (created_at);

-- === WORKFLOW & AUDIT INDEXES ===

-- User activity tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_actor_org_at 
ON audit_logs (actor_user_id, org_id, at DESC);

-- Org-wide audit queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_org_action_at 
ON audit_logs (org_id, action, at DESC);

-- === SPECIALIZED WORKFLOW INDEXES ===

-- Vehicle intake workflow
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicle_intakes_org_status_created 
ON vehicle_intakes (org_id, status, created_at DESC);

-- Payment method analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_intents_method_status 
ON payment_intents (method, status);

-- Status-based queries (monitoring dashboards)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_status_updated 
ON vehicles (status, updated_at DESC);

COMMIT;

-- === POST-MIGRATION ANALYSIS ===
-- Monitor these after deployment:

-- 1. Index usage statistics
-- SELECT * FROM pg_stat_user_indexes WHERE schemaname = 'public' ORDER BY idx_scan DESC;

-- 2. Table bloat after index creation  
-- SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
-- FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 3. Slow query monitoring
-- SELECT query, calls, total_exec_time, mean_exec_time 
-- FROM pg_stat_statements 
-- WHERE query LIKE '%vehicles%' OR query LIKE '%insurance_claims%' OR query LIKE '%service_requests%'
-- ORDER BY mean_exec_time DESC LIMIT 20;