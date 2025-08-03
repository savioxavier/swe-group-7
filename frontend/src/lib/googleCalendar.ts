interface GoogleCalendarEvent {
  summary: string
  description: string
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
}

interface GoogleCalendarConfig {
  apiKey: string
  clientId: string
  discoveryDoc: string
  scopes: string[]
}

class GoogleCalendarAPI {
  private static config: GoogleCalendarConfig = {
    apiKey: process.env.REACT_APP_GOOGLE_API_KEY || '',
    clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || '',
    discoveryDoc: 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
    scopes: ['https://www.googleapis.com/auth/calendar.events']
  }

  private static gapi: any = null
  private static isInitialized = false

  static async initialize(): Promise<boolean> {
    try {
      if (this.isInitialized) return true

      // Load Google API script
      await this.loadGoogleAPI()
      
      // Initialize the Google API client
      await this.gapi.load('client:auth2', async () => {
        await this.gapi.client.init({
          apiKey: this.config.apiKey,
          clientId: this.config.clientId,
          discoveryDocs: [this.config.discoveryDoc],
          scope: this.config.scopes.join(' ')
        })
      })

      this.isInitialized = true
      return true
    } catch (error) {
      console.error('Failed to initialize Google Calendar API:', error)
      return false
    }
  }

  private static loadGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        this.gapi = window.gapi
        resolve()
        return
      }

      const script = document.createElement('script')
      script.src = 'https://apis.google.com/js/api.js'
      script.onload = () => {
        this.gapi = window.gapi
        resolve()
      }
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  static async signIn(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize()
        if (!initialized) return false
      }

      const authInstance = this.gapi.auth2.getAuthInstance()
      const user = await authInstance.signIn()
      
      return user.isSignedIn()
    } catch (error) {
      console.error('Failed to sign in to Google:', error)
      return false
    }
  }

  static async isSignedIn(): Promise<boolean> {
    try {
      if (!this.isInitialized) return false
      
      const authInstance = this.gapi.auth2.getAuthInstance()
      return authInstance.isSignedIn.get()
    } catch (error) {
      console.error('Failed to check sign-in status:', error)
      return false
    }
  }

  static async createEvent(event: GoogleCalendarEvent): Promise<boolean> {
    try {
      if (!await this.isSignedIn()) {
        const signedIn = await this.signIn()
        if (!signedIn) {
          throw new Error('User not signed in to Google')
        }
      }

      const request = {
        calendarId: 'primary',
        resource: event
      }

      const response = await this.gapi.client.calendar.events.insert(request)
      console.log('Event created:', response.result)
      return true
    } catch (error) {
      console.error('Failed to create calendar event:', error)
      return false
    }
  }

  static async exportTaskToCalendar(
    taskName: string,
    taskDescription: string,
    selectedDate: string,
    selectedTime: string,
    duration: number
  ): Promise<boolean> {
    try {
      // Create start and end date times
      const startDateTime = new Date(`${selectedDate}T${selectedTime}:00`)
      const endDateTime = new Date(startDateTime.getTime() + (duration * 60 * 60 * 1000))

      const event: GoogleCalendarEvent = {
        summary: `${taskName} - ${taskDescription}`,
        description: `Task: ${taskName}\nDescription: ${taskDescription}\nDuration: ${duration} hour(s)\n\nCreated from Task Garden`,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      }

      return await this.createEvent(event)
    } catch (error) {
      console.error('Failed to export task to calendar:', error)
      return false
    }
  }

  static async exportMultipleTasks(tasks: Array<{
    taskName: string
    taskDescription: string
    selectedDate: string
    selectedTime: string
    duration: number
  }>): Promise<{ success: number, failed: number }> {
    let success = 0
    let failed = 0

    for (const task of tasks) {
      const result = await this.exportTaskToCalendar(
        task.taskName,
        task.taskDescription,
        task.selectedDate,
        task.selectedTime,
        task.duration
      )

      if (result) {
        success++
      } else {
        failed++
      }

      // Small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    return { success, failed }
  }
}

// Extend window interface for TypeScript
declare global {
  interface Window {
    gapi: any
  }
}

export { GoogleCalendarAPI, type GoogleCalendarEvent }
