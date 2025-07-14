
Google Calendar API Integration (Python)

Project Folder Structure:

google-calendar-api-test/

    GoogleCalendarAPITest.py (Main script to access Google Calendar)

    requirements.txt (Python dependencies)

    Secrets/

        client_secrets.json (OAuth 2.0 credentials file)

    venv/ (Virtual environment - not tracked in Git)

Setup Instructions:

    Open a terminal and navigate to the project:
    cd google-calendar-api-test

    Create a Python virtual environment:
    python3 -m venv venv
    source venv/bin/activate
    (Windows: venv\Scripts\activate)

    Install required dependencies:
    pip install -r requirements.txt

If requirements.txt doesn't exist or is outdated, run:
pip install google-auth-oauthlib google-api-python-client
pip freeze > requirements.txt

    Set up Google OAuth credentials:

    Go to https://console.cloud.google.com/

    Create or select a project

    Enable “Google Calendar API”

    Go to “APIs & Services” > “Credentials”

    Click “Create Credentials” > “OAuth client ID”

    Choose “Desktop App” and name it

    Download the file and rename it to client_secrets.json

    Place it inside the Secrets/ folder in your project

    Run the script:
    python GoogleCalendarAPITest.py
