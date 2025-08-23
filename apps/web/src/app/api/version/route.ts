import { NextResponse } from 'next/server'

export async function GET() {
  const version = {
    version: '1.0.0',
    build: process.env.BUILD_ID || 'development',
    commit: process.env.COMMIT_SHA || 'local',
    timestamp: new Date().toISOString(),
    node: process.version,
    environment: process.env.NODE_ENV || 'development'
  }
  
  return NextResponse.json(version, { status: 200 })
}