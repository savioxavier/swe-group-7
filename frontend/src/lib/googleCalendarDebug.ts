// Debug utility for Google Calendar API issues
export class GoogleCalendarDebug {
  static checkEnvironmentVariables() {
    console.log('=== Google Calendar Environment Variables ===')
    console.log('VITE_GOOGLE_API_KEY:', import.meta.env.VITE_GOOGLE_API_KEY ? 'Set (length: ' + import.meta.env.VITE_GOOGLE_API_KEY.length + ')' : 'NOT SET')
    console.log('VITE_GOOGLE_CLIENT_ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID ? 'Set (length: ' + import.meta.env.VITE_GOOGLE_CLIENT_ID.length + ')' : 'NOT SET')
    
    // Check if the client ID looks correct (should end with .apps.googleusercontent.com)
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (clientId && !clientId.endsWith('.apps.googleusercontent.com')) {
      console.warn('⚠️ Client ID format looks incorrect. Should end with .apps.googleusercontent.com')
    }
    
    console.log('Current origin:', window.location.origin)
    console.log('Current port:', window.location.port)
    console.log('===')
  }

  static checkGoogleAPIScript() {
    console.log('=== Google API Script Status ===')
    console.log('window.gapi available:', !!window.gapi)
    console.log('window.google available:', !!window.google)
    console.log('Google Identity Services available:', !!window.google?.accounts)
    
    if (window.gapi) {
      console.log('gapi.load function:', typeof window.gapi.load)
      console.log('gapi.client available:', !!window.gapi.client)
    }
    
    if (window.google?.accounts) {
      console.log('google.accounts.oauth2 available:', !!window.google.accounts.oauth2)
    }
    console.log('===')
  }

  static async testGoogleAPIConnection() {
    console.log('=== Testing Google API Connection ===')
    
    try {
      // Test if we can load the Google API script
      const apiScript = document.createElement('script')
      apiScript.src = 'https://apis.google.com/js/api.js'
      
      const apiLoadPromise = new Promise((resolve, reject) => {
        apiScript.onload = resolve
        apiScript.onerror = reject
        setTimeout(() => reject(new Error('API script load timeout')), 10000)
      })
      
      document.head.appendChild(apiScript)
      await apiLoadPromise
      console.log('✅ Google API script loaded successfully')
      
      // Test if we can load Google Identity Services
      const gisScript = document.createElement('script')
      gisScript.src = 'https://accounts.google.com/gsi/client'
      
      const gisLoadPromise = new Promise((resolve, reject) => {
        gisScript.onload = resolve
        gisScript.onerror = reject
        setTimeout(() => reject(new Error('GIS script load timeout')), 10000)
      })
      
      document.head.appendChild(gisScript)
      await gisLoadPromise
      console.log('✅ Google Identity Services script loaded successfully')
      
      // Test gapi.load
      await new Promise<void>((resolve, reject) => {
        window.gapi.load('client', () => {
          console.log('✅ Google API client loaded')
          resolve()
        }, (error: any) => {
          console.error('❌ Failed to load Google API client:', error)
          reject(error)
        })
      })
      
    } catch (error) {
      console.error('❌ Google API connection test failed:', error)
    }
    console.log('===')
  }

  static checkOAuthConfiguration() {
    console.log('=== OAuth Configuration Check ===')
    console.log('📋 Make sure your Google Cloud Console is configured with:')
    console.log('1. Authorized JavaScript origins:')
    console.log('   - http://localhost:5173')
    console.log('   - http://127.0.0.1:5173')
    console.log('2. Authorized redirect URIs:')
    console.log('   - http://localhost:5173')
    console.log('   - http://127.0.0.1:5173')
    console.log('')
    console.log('Current origin that needs to be authorized:', window.location.origin)
    console.log('===')
  }

  static async runFullDiagnostic() {
    console.log('🔍 Running Google Calendar API Diagnostic...')
    console.log('')
    
    this.checkEnvironmentVariables()
    this.checkGoogleAPIScript()
    this.checkOAuthConfiguration()
    
    console.log('Running connection test...')
    await this.testGoogleAPIConnection()
    
    console.log('🔍 Diagnostic complete. Check console output above for issues.')
  }
}

// Make it available globally for easy debugging
declare global {
  interface Window {
    googleCalendarDebug: typeof GoogleCalendarDebug
  }
}

window.googleCalendarDebug = GoogleCalendarDebug
