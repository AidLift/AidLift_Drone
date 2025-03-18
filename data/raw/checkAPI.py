import os
from google.oauth2 import service_account
from googleapiclient.discovery import build

def check_api_connection():
    try:
        # Use the correct file path
        key_file = r"C:\Users\Zahid\AidLift_Drone\data\keys\service_account_key.json"

        # Ensure the file exists before proceeding
        if not os.path.exists(key_file):
            raise FileNotFoundError(f"Service account key file '{key_file}' not found.")

        print(f"Service account key found at: {key_file}")

        # ✅ Directly load credentials from file
        creds = service_account.Credentials.from_service_account_file(
            key_file, scopes=["https://www.googleapis.com/auth/drive"]
        )

        print("✅ Credentials successfully created.")

        # Build the Google Drive service
        service = build('drive', 'v3', credentials=creds)

        # Test API connection (list files)
        results = service.files().list(pageSize=10).execute()
        items = results.get('files', [])

        if not items:
            print('❌ No files found in Google Drive.')
        else:
            print('✅ Files:')
            for item in items:
                print(f"{item['name']} ({item['mimeType']})")

        print("Successfully connected to Google Drive API!")

    except Exception as e:
        print(f"❌ Error connecting to Google Drive API: {e}")

if __name__ == '__main__':
    check_api_connection()
