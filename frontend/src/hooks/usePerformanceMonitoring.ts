import { useCallback } from 'react'

interface PerformanceMetrics {
  operationName: string
  duration: number
  timestamp: number
  success: boolean
}

export const usePerformanceMonitoring = () => {
  const trackOperation = useCallback(async <T>(
    operationName: string, 
    operation: () => Promise<T>
  ): Promise<T> => {
    const start = performance.now()
    const timestamp = Date.now()
    
    try {
      const result = await operation()
      const duration = performance.now() - start
      
      // Log performance metrics
      const metrics: PerformanceMetrics = {
        operationName,
        duration,
        timestamp,
        success: true
      }
      
      console.log(`${operationName}: ${duration.toFixed(2)}ms`)
      
      // Warn about slow operations
      if (duration > 1000) {
        console.warn(`Slow operation detected: ${operationName} (${duration.toFixed(2)}ms)`)
      }
      
      // Store metrics for analysis
      if (typeof window !== 'undefined') {
        const existingMetrics = JSON.parse(localStorage.getItem('performance_metrics') || '[]')
        existingMetrics.push(metrics)
        
        // Keep only last 100 metrics to avoid storage bloat
        if (existingMetrics.length > 100) {
          existingMetrics.splice(0, existingMetrics.length - 100)
        }
        
        localStorage.setItem('performance_metrics', JSON.stringify(existingMetrics))
      }
      
      return result
    } catch (error) {
      const duration = performance.now() - start
      
      const metrics: PerformanceMetrics = {
        operationName,
        duration,
        timestamp,
        success: false
      }
      
      console.error(`${operationName} failed after ${duration.toFixed(2)}ms:`, error)
      
      // Store failed metrics too
      if (typeof window !== 'undefined') {
        const existingMetrics = JSON.parse(localStorage.getItem('performance_metrics') || '[]')
        existingMetrics.push(metrics)
        localStorage.setItem('performance_metrics', JSON.stringify(existingMetrics))
      }
      
      throw error
    }
  }, [])

  const getPerformanceReport = useCallback(() => {
    if (typeof window === 'undefined') return null
    
    const metrics: PerformanceMetrics[] = JSON.parse(localStorage.getItem('performance_metrics') || '[]')
    
    if (metrics.length === 0) return null
    
    const report = {
      totalOperations: metrics.length,
      successRate: (metrics.filter(m => m.success).length / metrics.length) * 100,
      averageDuration: metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length,
      slowOperations: metrics.filter(m => m.duration > 1000).length,
      operationBreakdown: metrics.reduce((acc, metric) => {
        if (!acc[metric.operationName]) {
          acc[metric.operationName] = {
            count: 0,
            totalDuration: 0,
            successCount: 0,
            averageDuration: 0,
            successRate: 0
          }
        }
        acc[metric.operationName].count++
        acc[metric.operationName].totalDuration += metric.duration
        if (metric.success) acc[metric.operationName].successCount++
        return acc
      }, {} as Record<string, { 
        count: number, 
        totalDuration: number, 
        successCount: number,
        averageDuration: number,
        successRate: number
      }>)
    }
    
    // Calculate averages for each operation
    Object.keys(report.operationBreakdown).forEach(op => {
      const data = report.operationBreakdown[op]
      data.averageDuration = data.totalDuration / data.count
      data.successRate = (data.successCount / data.count) * 100
    })
    
    return report
  }, [])

  const clearPerformanceData = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('performance_metrics')
    }
  }, [])

  return {
    trackOperation,
    getPerformanceReport,
    clearPerformanceData
  }
}
