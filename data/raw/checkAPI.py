import os
import json
import google.auth
from googleapiclient.discovery import build

def check_api_connection():
    try:
        # Load credentials from environment variable
        key_data = os.environ.get("GOOGLE_SERVICE_ACCOUNT_KEY")
        if key_data is None:
            raise ValueError("GOOGLE_SERVICE_ACCOUNT_KEY environment variable not set.")
        creds_info = json.loads(key_data)
        creds = google.oauth2.service_account.Credentials.from_service_account_info(creds_info)

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
        print(f"Error connecting to Google Drive API using service account: {e}")

if __name__ == '__main__':
    check_api_connection()


    