import os
import json
from google.oauth2 import service_account
from googleapiclient.discovery import build

def check_api_connection():
    try:
        # Load credentials from environment variable
        key_data = os.environ.get("GOOGLE_SERVICE_ACCOUNT_KEY")
        if key_data is None:
            raise ValueError("GOOGLE_SERVICE_ACCOUNT_KEY environment variable not set.")
        
        # Debug: Print the environment variable value
        print("Environment variable value:", key_data)

        # Parse the JSON content
        creds_info = json.loads(key_data)
        
        # Debug: Print the parsed credentials info
        print("Parsed credentials info:", creds_info)

        # Create credentials from the JSON content
        creds = service_account.Credentials.from_service_account_info(creds_info, scopes=["https://www.googleapis.com/auth/drive"])

        # Debug: Print the credentials object
        print("Credentials object:", creds)

        # Build the service (e.g., Google Drive API)
        service = build('drive', 'v3', credentials=creds)

        # Attempt a simple API call (e.g., list files)
        results = service.files().list(pageSize=10).execute()
        items = results.get('files', [])

        if not items:
            print('No files found.')
        else:
            print('Files:')
            for item in items:
                print(f"{item['name']} ({item['mimeType']})")

        print("Successfully connected to Google Drive API using service account!")

    except Exception as e:
        print(f"Error connecting to Google Drive API: {e}")

if __name__ == '__main__':
    check_api_connection()