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
    apiKey: import.meta.env.VITE_GOOGLE_API_KEY || '',
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    discoveryDoc: 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
    scopes: ['https://www.googleapis.com/auth/calendar.events']
  }

  private static gapi: any = null
  private static google: any = null
  private static isInitialized = false
  private static accessToken: string | null = null

  private static validateConfig(): boolean {
    if (!this.config.apiKey) {
      console.error('VITE_GOOGLE_API_KEY is not set in environment variables')
      return false
    }
    if (!this.config.clientId) {
      console.error('VITE_GOOGLE_CLIENT_ID is not set in environment variables')
      return false
    }
    return true
  }

  static async initialize(): Promise<boolean> {
    try {
      if (this.isInitialized) return true

      console.log('Initializing Google Calendar API...')

      if (!this.validateConfig()) {
        return false
      }

      // Load both Google API scripts
      await Promise.all([
        this.loadGoogleAPI(),
        this.loadGoogleIdentity()
      ])
      
      // Initialize the Google API client (without auth2)
      await new Promise<void>((resolve, reject) => {
        this.gapi.load('client', async () => {
          try {
            await this.gapi.client.init({
              apiKey: this.config.apiKey,
              discoveryDocs: [this.config.discoveryDoc]
            })
            console.log('Google API client initialized successfully')
            resolve()
          } catch (error) {
            console.error('Failed to initialize Google API client:', error)
            reject(error)
          }
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

  private static loadGoogleIdentity(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.google) {
        this.google = window.google
        resolve()
        return
      }

      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.onload = () => {
        this.google = window.google
        resolve()
      }
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  static async signIn(): Promise<boolean> {
    try {
      console.log('Attempting to sign in to Google...')
      
      if (!this.isInitialized) {
        console.log('API not initialized, initializing now...')
        const initialized = await this.initialize()
        if (!initialized) {
          console.error('Failed to initialize Google API')
          return false
        }
      }

      return new Promise((resolve) => {
        const tokenClient = this.google.accounts.oauth2.initTokenClient({
          client_id: this.config.clientId,
          scope: this.config.scopes.join(' '),
          callback: (tokenResponse: any) => {
            if (tokenResponse.error) {
              console.error('Token request failed:', tokenResponse.error)
              resolve(false)
              return
            }
            
            this.accessToken = tokenResponse.access_token
            console.log('Sign-in successful, token received')
            resolve(true)
          }
        })

        console.log('Requesting access token...')
        tokenClient.requestAccessToken()
      })
    } catch (error) {
      console.error('Failed to sign in to Google:', error)
      return false
    }
  }

  static async isSignedIn(): Promise<boolean> {
    return !!this.accessToken
  }

  static async createEvent(event: GoogleCalendarEvent): Promise<boolean> {
    try {
      if (!await this.isSignedIn()) {
        const signedIn = await this.signIn()
        if (!signedIn) {
          throw new Error('User not signed in to Google')
        }
      }

      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
      })

      if (!response.ok) {
        throw new Error(`Calendar API error: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      console.log('Event created:', result)
      return true
    } catch (error) {
      console.error('Failed to create calendar event:', error)
      return false
    }
  }

  static async exportTaskToCalendar(
    taskName: string,
    taskCategory: string,
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
        summary: `${taskName} - ${taskCategory}`,
        description: taskDescription,
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
    taskCategory: string
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
        task.taskCategory,
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
    google: any
  }
}

export { GoogleCalendarAPI, type GoogleCalendarEvent }
