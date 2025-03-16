from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from google.oauth2 import service_account
import os
import io

# Path to your credentials JSON file
CREDENTIALS_FILE = "credentials.json"  # Changed to relative path

# Google Drive Folder ID (extract from your Drive link)
FOLDER_ID = "106JhKlMqQD54Tk0gyU2BB2Sh4AFvbvN5"

# Set the local folder where you want to save files
SAVE_FOLDER = "data/raw"
os.makedirs(SAVE_FOLDER, exist_ok=True)

# Authenticate and connect to the Google Drive API
creds = service_account.Credentials.from_service_account_file(CREDENTIALS_FILE, scopes=["https://www.googleapis.com/auth/drive"])
service = build("drive", "v3", credentials=creds)

# Function to list all files in a Drive folder, excluding folders
def list_drive_files(folder_id):
    query = f"'{folder_id}' in parents and trashed=false and mimeType != 'application/vnd.google-apps.folder'"
    results = service.files().list(q=query, fields="files(id, name, mimeType)").execute()
    return results.get("files", [])

# Function to download a file from Google Drive
def download_file(file_id, file_name, save_path):
    request = service.files().get_media(fileId=file_id)
    file_path = os.path.join(save_path, file_name)
    try:
        with open(file_path, "wb") as f:
            downloader = MediaIoBaseDownload(f, request)
            done = False
            while not done:
                status, done = downloader.next_chunk()
                print(f"Downloading {file_name}... {int(status.progress() * 100)}%")
        print(f"Downloaded: {file_name}")
    except Exception as e:
        print(f"Error downloading {file_name}: {e}")

# Get all files in the Google Drive folder
files = list_drive_files(FOLDER_ID)

# Download each file
for file in files:
    file_id = file["id"]
    file_name = file["name"]
    download_file(file_id, file_name, SAVE_FOLDER)

print("All files downloaded successfully!")