interface CalendarExportData {
  taskId: string
  taskName: string
  taskDescription: string
  selectedDate: string
  selectedTime: string
  duration: number // in hours
  created?: string
}

class CalendarExportService {
  private static STORAGE_KEY = 'calendar_exports'

  static saveExport(data: CalendarExportData): void {
    try {
      const existingExports = this.getExports()
      const newExport = {
        ...data,
        created: new Date().toISOString()
      }
      
      existingExports.push(newExport)
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingExports))
      
      console.log('Calendar export saved:', newExport)
    } catch (error) {
      console.error('Failed to save calendar export:', error)
    }
  }

  static getExports(): CalendarExportData[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Failed to get calendar exports:', error)
      return []
    }
  }

  static clearExports(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear calendar exports:', error)
    }
  }

  static deleteExport(taskId: string, created: string): void {
    try {
      const existingExports = this.getExports()
      const filteredExports = existingExports.filter(
        exp => !(exp.taskId === taskId && exp.created === created)
      )
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredExports))
    } catch (error) {
      console.error('Failed to delete calendar export:', error)
    }
  }

  // Utility method for debugging - view all exports in console
  static logAllExports(): void {
    const exports = this.getExports()
    console.log('All Calendar Exports:', exports)
    console.table(exports)
  }
}

export { CalendarExportService, type CalendarExportData }
