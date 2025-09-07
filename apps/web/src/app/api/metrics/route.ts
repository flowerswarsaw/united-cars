import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Get basic system metrics
    const systemMetrics = getSystemMetrics();
    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      system: systemMetrics,
      api: {
        responseTime: `${responseTime}ms`,
        status: 'operational'
      }
    });
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      error: error instanceof Error ? error.message : 'Metrics collection failed',
      status: 'error'
    }, { status: 500 });
  }
}

function getSystemMetrics() {
  const memory = process.memoryUsage();
  
  return {
    uptime: process.uptime(),
    memory: {
      used: `${Math.round(memory.heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(memory.heapTotal / 1024 / 1024)}MB`,
      utilization: `${Math.round((memory.heapUsed / memory.heapTotal) * 100)}%`,
      external: `${Math.round(memory.external / 1024 / 1024)}MB`
    },
    nodeVersion: process.version,
    platform: process.platform,
    environment: process.env.NODE_ENV
  };
}