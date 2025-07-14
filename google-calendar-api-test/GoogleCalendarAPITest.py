import os
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

# Google Calendar API scope: read-only access
SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']

# Get the current directory (where this script is located)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Build the full path to the client secret JSON file
secret_file = 'client_secret.json'
secret_path = os.path.join(BASE_DIR, 'Secrets', secret_file)

# Start OAuth flow
flow = InstalledAppFlow.from_client_secrets_file(secret_path, SCOPES)
creds = flow.run_local_server(port=8080)

# Build the Calendar API service
service = build('calendar', 'v3', credentials=creds)

# Fetch the next 10 events
events_result = service.events().list(
    calendarId='primary', maxResults=10, singleEvents=True,
    orderBy='startTime').execute()
events = events_result.get('items', [])

# Print results
if not events:
    print("No upcoming events found.")
for event in events:
    start = event['start'].get('dateTime', event['start'].get('date'))
    print(start, event['summary'])
