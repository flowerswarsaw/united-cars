import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from') || 'USD'
    const to = searchParams.get('to') || 'EUR'

    // Using exchangerate-api.com (free tier: 1500 requests/month)
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`, {
      headers: {
        'User-Agent': 'United-Cars-Calculator/1.0'
      },
      // Cache for 1 hour
      next: { revalidate: 3600 }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates')
    }

    const data = await response.json()
    
    if (!data.rates || !data.rates[to]) {
      throw new Error(`Exchange rate not found for ${from} to ${to}`)
    }

    return NextResponse.json({
      success: true,
      rate: data.rates[to],
      from,
      to,
      date: data.date,
      base: data.base
    })
  } catch (error) {
    console.error('Exchange rate API error:', error)
    
    // Fallback to static rate if API fails
    return NextResponse.json({
      success: false,
      rate: 0.92, // Fallback USD to EUR rate
      from: 'USD',
      to: 'EUR',
      date: new Date().toISOString().split('T')[0],
      fallback: true,
      error: 'Using fallback rate'
    })
  }
}