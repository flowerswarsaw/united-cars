import { useState, useEffect } from 'react'

interface ExchangeRateData {
  rate: number
  from: string
  to: string
  date: string
  fallback?: boolean
  error?: string
}

export function useCurrencyConversion(from = 'USD', to = 'EUR') {
  const [exchangeRate, setExchangeRate] = useState<number>(0.92) // Fallback rate
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [isFallback, setIsFallback] = useState(false)

  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/exchange-rate?from=${from}&to=${to}`)
        const data: ExchangeRateData = await response.json()
        
        setExchangeRate(data.rate)
        setLastUpdated(data.date)
        setIsFallback(data.fallback || false)
        
        if (data.error) {
          setError(data.error)
        }
      } catch (err) {
        setError('Failed to fetch exchange rate')
        setExchangeRate(0.92) // Fallback
        setIsFallback(true)
      } finally {
        setLoading(false)
      }
    }

    fetchExchangeRate()
  }, [from, to])

  const convert = (amount: number) => {
    return amount * exchangeRate
  }

  const refresh = async () => {
    const fetchExchangeRate = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/exchange-rate?from=${from}&to=${to}&_t=${Date.now()}`)
        const data: ExchangeRateData = await response.json()
        
        setExchangeRate(data.rate)
        setLastUpdated(data.date)
        setIsFallback(data.fallback || false)
        
        if (data.error) {
          setError(data.error)
        }
      } catch (err) {
        setError('Failed to fetch exchange rate')
      } finally {
        setLoading(false)
      }
    }

    await fetchExchangeRate()
  }

  return {
    exchangeRate,
    convert,
    loading,
    error,
    lastUpdated,
    isFallback,
    refresh
  }
}