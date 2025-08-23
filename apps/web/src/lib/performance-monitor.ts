/**
 * Database Performance Monitoring Utilities
 * Tracks query performance, index usage, and provides optimization insights
 */

import { prisma } from '@united-cars/db'

export interface QueryPerformanceMetric {
  query: string
  calls: number
  totalTime: number
  meanTime: number
  maxTime?: number
  minTime?: number
  rows: number
}

export interface IndexUsageMetric {
  schemaName: string
  tableName: string
  indexName: string
  indexScans: number
  tupleReads: number
  tupleFetches: number
  sizeBytes: number
}

export interface TableSizeMetric {
  tableName: string
  rowCount: number
  sizeBytes: number
  indexSizeBytes: number
  totalSizeBytes: number
}

/**
 * Get slow query statistics from pg_stat_statements
 * Requires pg_stat_statements extension to be enabled
 */
export async function getSlowQueries(limit: number = 20): Promise<QueryPerformanceMetric[]> {
  try {
    const result = await prisma.$queryRaw<any[]>`
      SELECT 
        query,
        calls,
        total_exec_time as "totalTime",
        mean_exec_time as "meanTime",
        max_exec_time as "maxTime", 
        min_exec_time as "minTime",
        rows
      FROM pg_stat_statements 
      WHERE query NOT LIKE '%pg_stat_statements%'
        AND query NOT LIKE '%information_schema%'
        AND calls > 1
      ORDER BY mean_exec_time DESC 
      LIMIT ${limit}
    `

    return result.map(row => ({
      query: row.query.substring(0, 200) + (row.query.length > 200 ? '...' : ''),
      calls: Number(row.calls),
      totalTime: Number(row.totalTime),
      meanTime: Number(row.meanTime),
      maxTime: row.maxTime ? Number(row.maxTime) : undefined,
      minTime: row.minTime ? Number(row.minTime) : undefined,
      rows: Number(row.rows)
    }))
  } catch (error) {
    console.warn('pg_stat_statements not available:', error)
    return []
  }
}

/**
 * Get index usage statistics to identify unused or inefficient indexes
 */
export async function getIndexUsage(): Promise<IndexUsageMetric[]> {
  try {
    const result = await prisma.$queryRaw<any[]>`
      SELECT 
        schemaname as "schemaName",
        tablename as "tableName", 
        indexname as "indexName",
        idx_scan as "indexScans",
        idx_tup_read as "tupleReads",
        idx_tup_fetch as "tupleFetches",
        pg_relation_size(indexrelid) as "sizeBytes"
      FROM pg_stat_user_indexes 
      WHERE schemaname = 'public'
      ORDER BY idx_scan DESC
    `

    return result.map(row => ({
      schemaName: row.schemaName,
      tableName: row.tableName,
      indexName: row.indexName,
      indexScans: Number(row.indexScans),
      tupleReads: Number(row.tupleReads),
      tupleFetches: Number(row.tupleFetches),
      sizeBytes: Number(row.sizeBytes)
    }))
  } catch (error) {
    console.error('Error getting index usage:', error)
    return []
  }
}

/**
 * Get table size and row count statistics
 */
export async function getTableSizes(): Promise<TableSizeMetric[]> {
  try {
    const result = await prisma.$queryRaw<any[]>`
      SELECT 
        tablename as "tableName",
        n_tup_ins + n_tup_upd - n_tup_del as "rowCount",
        pg_table_size(schemaname||'.'||tablename) as "sizeBytes",
        pg_indexes_size(schemaname||'.'||tablename) as "indexSizeBytes",
        pg_total_relation_size(schemaname||'.'||tablename) as "totalSizeBytes"
      FROM pg_stat_user_tables 
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    `

    return result.map(row => ({
      tableName: row.tableName,
      rowCount: Number(row.rowCount),
      sizeBytes: Number(row.sizeBytes),
      indexSizeBytes: Number(row.indexSizeBytes),
      totalSizeBytes: Number(row.totalSizeBytes)
    }))
  } catch (error) {
    console.error('Error getting table sizes:', error)
    return []
  }
}

/**
 * Analyze query patterns for specific entity types
 */
export async function analyzeEntityQueryPatterns(entityType: string): Promise<{
  totalQueries: number
  avgResponseTime: number
  commonFilters: string[]
  recommendedIndexes: string[]
}> {
  const entityQueries = await prisma.$queryRaw<any[]>`
    SELECT query, calls, mean_exec_time
    FROM pg_stat_statements 
    WHERE query ILIKE '%${entityType}%'
      AND calls > 5
    ORDER BY calls DESC
    LIMIT 10
  `

  const totalQueries = entityQueries.reduce((sum, q) => sum + Number(q.calls), 0)
  const avgResponseTime = entityQueries.reduce((sum, q) => sum + Number(q.mean_exec_time), 0) / entityQueries.length

  // Analyze common filter patterns
  const commonFilters: string[] = []
  const recommendedIndexes: string[] = []

  entityQueries.forEach(query => {
    const queryText = query.query.toLowerCase()
    if (queryText.includes('org_id')) commonFilters.push('org_id')
    if (queryText.includes('status')) commonFilters.push('status')
    if (queryText.includes('created_at')) commonFilters.push('created_at')
    if (queryText.includes('vehicle_id')) commonFilters.push('vehicle_id')
  })

  // Generate index recommendations based on patterns
  const uniqueFilters = [...new Set(commonFilters)]
  if (uniqueFilters.includes('org_id') && uniqueFilters.includes('status')) {
    recommendedIndexes.push(`idx_${entityType}_org_status_created`)
  }
  if (uniqueFilters.includes('vehicle_id')) {
    recommendedIndexes.push(`idx_${entityType}_vehicle_status`)
  }

  return {
    totalQueries,
    avgResponseTime,
    commonFilters: uniqueFilters,
    recommendedIndexes
  }
}

/**
 * Format bytes to human readable format
 */
export function formatBytes(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  if (bytes === 0) return '0 Byte'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Performance monitoring dashboard data
 */
export async function getPerformanceDashboard() {
  const [slowQueries, indexUsage, tableSizes] = await Promise.all([
    getSlowQueries(10),
    getIndexUsage(),
    getTableSizes()
  ])

  // Calculate totals and insights
  const totalQueries = slowQueries.reduce((sum, q) => sum + q.calls, 0)
  const avgQueryTime = slowQueries.reduce((sum, q) => sum + q.meanTime, 0) / slowQueries.length
  
  const totalIndexSize = indexUsage.reduce((sum, idx) => sum + idx.sizeBytes, 0)
  const unusedIndexes = indexUsage.filter(idx => idx.indexScans < 10)
  
  const totalTableSize = tableSizes.reduce((sum, tbl) => sum + tbl.totalSizeBytes, 0)
  const largestTables = tableSizes.slice(0, 5)

  return {
    overview: {
      totalQueries,
      avgQueryTime: Math.round(avgQueryTime * 100) / 100,
      totalIndexSize: formatBytes(totalIndexSize),
      totalTableSize: formatBytes(totalTableSize),
      unusedIndexCount: unusedIndexes.length
    },
    slowQueries: slowQueries.slice(0, 5),
    indexUsage: indexUsage.slice(0, 10),
    tableSizes: largestTables,
    recommendations: [
      ...unusedIndexes.length > 0 ? [`Consider removing ${unusedIndexes.length} unused indexes`] : [],
      ...slowQueries.some(q => q.meanTime > 100) ? ['Some queries are taking >100ms, consider optimization'] : [],
      ...tableSizes.some(t => t.indexSizeBytes > t.sizeBytes) ? ['Some tables have more index data than table data'] : []
    ]
  }
}

/**
 * Query performance testing utility
 */
export class QueryProfiler {
  private startTime: number = 0
  private queryCount: number = 0

  start() {
    this.startTime = Date.now()
    this.queryCount = 0
  }

  async profile<T>(queryFn: () => Promise<T>, description: string): Promise<T> {
    const queryStart = Date.now()
    this.queryCount++
    
    try {
      const result = await queryFn()
      const queryTime = Date.now() - queryStart
      
      console.log(`[Query ${this.queryCount}] ${description}: ${queryTime}ms`)
      
      return result
    } catch (error) {
      const queryTime = Date.now() - queryStart
      console.error(`[Query ${this.queryCount}] ${description} FAILED: ${queryTime}ms`, error)
      throw error
    }
  }

  end(): { totalTime: number; queryCount: number } {
    const totalTime = Date.now() - this.startTime
    console.log(`\n[Profile Complete] ${this.queryCount} queries in ${totalTime}ms (avg: ${Math.round(totalTime / this.queryCount)}ms)`)
    
    return { totalTime, queryCount }
  }
}

/**
 * API endpoint for performance monitoring
 */
export async function handlePerformanceMonitoring(request: Request) {
  const url = new URL(request.url)
  const type = url.searchParams.get('type') || 'dashboard'

  switch (type) {
    case 'dashboard':
      return await getPerformanceDashboard()
    
    case 'slow-queries':
      const limit = parseInt(url.searchParams.get('limit') || '20')
      return await getSlowQueries(limit)
    
    case 'index-usage':
      return await getIndexUsage()
    
    case 'table-sizes':
      return await getTableSizes()
    
    case 'entity-analysis':
      const entity = url.searchParams.get('entity') || 'vehicles'
      return await analyzeEntityQueryPatterns(entity)
    
    default:
      throw new Error(`Unknown performance monitoring type: ${type}`)
  }
}