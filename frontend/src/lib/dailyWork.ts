interface DailyWorkLog {
  date: string // YYYY-MM-DD format
  plantId: string
  hours: number
  timestamp: string
}

class DailyWorkService {
  private static STORAGE_KEY = 'daily_work_logs'
  private static DEBUG_MODE_KEY = 'debug_mode_enabled'

  static isDebugModeEnabled(): boolean {
    try {
      const debugMode = localStorage.getItem(this.DEBUG_MODE_KEY)
      return debugMode === 'true'
    } catch (error) {
      console.error('Failed to get debug mode:', error)
      return false
    }
  }

  static setDebugMode(enabled: boolean): void {
    try {
      localStorage.setItem(this.DEBUG_MODE_KEY, enabled.toString())
      console.log('Debug mode:', enabled ? 'ENABLED' : 'DISABLED')
    } catch (error) {
      console.error('Failed to set debug mode:', error)
    }
  }

  static hasLoggedWorkToday(plantId?: string): boolean {
    try {
      const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
      const logs = this.getWorkLogs()
      
      if (plantId) {
        // Check if specific plant has been worked on today
        return logs.some(log => log.date === today && log.plantId === plantId)
      } else {
        // Check if any work has been logged today
        return logs.some(log => log.date === today)
      }
    } catch (error) {
      console.error('Failed to check daily work logs:', error)
      return false
    }
  }

  static logWork(plantId: string, hours: number): void {
    try {
      const today = new Date().toISOString().split('T')[0]
      const existingLogs = this.getWorkLogs()
      
      const newLog: DailyWorkLog = {
        date: today,
        plantId,
        hours,
        timestamp: new Date().toISOString()
      }
      
      existingLogs.push(newLog)
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingLogs))
      
      console.log('Work logged:', newLog)
    } catch (error) {
      console.error('Failed to log work:', error)
    }
  }

  static getWorkLogs(): DailyWorkLog[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Failed to get work logs:', error)
      return []
    }
  }

  static getTodaysWorkLogs(): DailyWorkLog[] {
    try {
      const today = new Date().toISOString().split('T')[0]
      return this.getWorkLogs().filter(log => log.date === today)
    } catch (error) {
      console.error('Failed to get today\'s work logs:', error)
      return []
    }
  }

  static getTodaysWorkForTask(plantId: string): DailyWorkLog[] {
    try {
      const today = new Date().toISOString().split('T')[0]
      return this.getWorkLogs().filter(log => log.date === today && log.plantId === plantId)
    } catch (error) {
      console.error('Failed to get today\'s work logs for task:', error)
      return []
    }
  }

  static getTodaysTaskStats(): { [taskId: string]: number } {
    try {
      const todaysLogs = this.getTodaysWorkLogs()
      const stats: { [taskId: string]: number } = {}
      
      todaysLogs.forEach(log => {
        if (!stats[log.plantId]) {
          stats[log.plantId] = 0
        }
        stats[log.plantId] += log.hours
      })
      
      return stats
    } catch (error) {
      console.error('Failed to get today\'s task stats:', error)
      return {}
    }
  }

  static clearOldLogs(): void {
    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0]
      
      const logs = this.getWorkLogs()
      const recentLogs = logs.filter(log => log.date >= cutoffDate)
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recentLogs))
      console.log(`Cleared logs older than ${cutoffDate}`)
    } catch (error) {
      console.error('Failed to clear old logs:', error)
    }
  }

  static clearAllLogs(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY)
      console.log('All work logs cleared')
    } catch (error) {
      console.error('Failed to clear all logs:', error)
    }
  }

  // Debug utility
  static logAllData(): void {
    const logs = this.getWorkLogs()
    const todaysLogs = this.getTodaysWorkLogs()
    const taskStats = this.getTodaysTaskStats()
    const debugMode = this.isDebugModeEnabled()
    
    console.log('=== DAILY WORK SERVICE DEBUG ===')
    console.log('Debug Mode:', debugMode)
    console.log('All Work Logs:', logs)
    console.log('Today\'s Work Logs:', todaysLogs)
    console.log('Today\'s Task Stats:', taskStats)
    console.table(todaysLogs)
    console.log('================================')
  }

  // Test utility for debugging
  static testScenarios(): void {
    console.log('=== TESTING DAILY WORK SCENARIOS ===')
    
    // Clear existing data
    this.clearAllLogs()
    this.setDebugMode(false)
    
    console.log('1. Fresh state - should allow work logging')
    console.log('Has logged today:', this.hasLoggedWorkToday())
    
    // Log some work
    this.logWork('test-plant-1', 2)
    console.log('2. After logging work - should prevent more logging')
    console.log('Has logged today:', this.hasLoggedWorkToday())
    
    // Enable debug mode
    this.setDebugMode(true)
    console.log('3. Debug mode enabled - should allow unlimited logging')
    console.log('Debug mode:', this.isDebugModeEnabled())
    
    // Test more logging
    this.logWork('test-plant-2', 1.5)
    console.log('4. After more logging in debug mode')
    console.log('Today\'s logs:', this.getTodaysWorkLogs().length)
    
    this.logAllData()
    console.log('===================================')
  }
}

export { DailyWorkService, type DailyWorkLog }
