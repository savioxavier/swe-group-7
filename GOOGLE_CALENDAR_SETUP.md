# Google Calendar API Setup Guide

## 🚀 How to Set Up Google Calendar Integration

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Create Project" or select an existing project
3. Give your project a name (e.g., "Task Garden Calendar")
4. Click "Create"

### Step 2: Enable Google Calendar API

1. In the Google Cloud Console, navigate to **APIs & Services > Library**
2. Search for "Google Calendar API"
3. Click on "Google Calendar API"
4. Click **"Enable"**

### Step 3: Create API Credentials

#### A. Create API Key
1. Go to **APIs & Services > Credentials**
2. Click **"+ CREATE CREDENTIALS"**
3. Select **"API key"**
4. Copy the API key (you'll need this for `REACT_APP_GOOGLE_API_KEY`)
5. (Optional) Click "Restrict Key" to limit usage to Google Calendar API only

#### B. Create OAuth 2.0 Client ID
1. In **APIs & Services > Credentials**
2. Click **"+ CREATE CREDENTIALS"**
3. Select **"OAuth client ID"**
4. If prompted, configure the OAuth consent screen first:
   - Choose "External" user type
   - Fill in required fields (App name, User support email, Developer contact)
   - Add your domain to authorized domains
   - Add scopes: `../auth/calendar.events`
5. For Application type, select **"Web application"**
6. Add authorized JavaScript origins:
   - `http://localhost:3000` (for development)
   - `https://yourdomain.com` (for production)
7. Add authorized redirect URIs:
   - `http://localhost:3000` (for development)
   - `https://yourdomain.com` (for production)
8. Click **"Create"**
9. Copy the Client ID (you'll need this for `REACT_APP_GOOGLE_CLIENT_ID`)

### Step 4: Configure OAuth Consent Screen

1. Go to **APIs & Services > OAuth consent screen**
2. Configure the consent screen:
   - **App name**: Task Garden
   - **User support email**: Your email
   - **App domain**: Your website domain
   - **Developer contact information**: Your email
3. Add scopes:
   - `../auth/calendar.events` (Create, read, update, and delete events)
4. Add test users (if in testing mode):
   - Add email addresses of users who can test the integration

### Step 5: Set Up Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your Google credentials to `.env`:
   ```env
   REACT_APP_GOOGLE_API_KEY=your_api_key_here
   REACT_APP_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
   ```

### Step 6: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the task panel
3. Click "Export to Calendar"
4. Fill in date, time, and duration
5. Click "Save Export"
6. The app will:
   - Prompt for Google sign-in (first time)
   - Create calendar events in your Google Calendar
   - Show success/error messages

## 🔧 How the Integration Works

### Event Format
When a task is exported, it creates a Google Calendar event with:

- **Title**: `{TaskName} - {TaskDescription}`
- **Description**: 
  ```
  Task: {TaskName}
  Description: {TaskDescription}
  Duration: {X} hour(s)
  
  Created from Task Garden
  ```
- **Start Time**: Selected date and time
- **End Time**: Start time + selected duration
- **Timezone**: User's local timezone

### Example Event
If you have a task named "Exercise" with description "Morning workout":

```
Title: Exercise - Morning workout
Description: Task: Exercise
            Description: Morning workout
            Duration: 1 hour(s)
            
            Created from Task Garden
Start: 2025-08-04 09:00 AM
End: 2025-08-04 10:00 AM
```

## 🔐 Security & Privacy

### OAuth Scopes Used
- `https://www.googleapis.com/auth/calendar.events`
  - Allows creating, reading, updating, and deleting calendar events
  - Does NOT access other Google services

### Data Handling
- Task data is only sent to Google Calendar when user explicitly exports
- No automatic or background syncing
- User controls what gets exported and when
- Local storage backup for export history

## 🐛 Troubleshooting

### Common Issues

1. **"Failed to connect to Google Calendar"**
   - Check API key and Client ID in `.env`
   - Ensure Google Calendar API is enabled
   - Verify domain is authorized in OAuth settings

2. **"Sign-in popup blocked"**
   - Enable popups for your domain
   - Try using a different browser

3. **"Insufficient permissions"**
   - Check OAuth consent screen configuration
   - Ensure calendar.events scope is added
   - Verify user has granted permissions

4. **"API key restrictions"**
   - Make sure API key allows Google Calendar API
   - Check if domain restrictions are too strict

### Development vs Production

- **Development**: Use `http://localhost:3000`
- **Production**: Replace with your actual domain
- Update both in Google Cloud Console and `.env` file

## 📝 Next Steps

After setup, users can:
1. Click "Export to Calendar" in task panel
2. Select date, time, and duration
3. Sign in to Google (first time only)
4. Export all active tasks to Google Calendar
5. View events in Google Calendar app/website

The integration provides a seamless way to move tasks from Task Garden into users' existing calendar workflows! 📅
