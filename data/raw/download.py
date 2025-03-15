from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
import os
import io
import pickle

# Define the scope
SCOPES = ['https://www.googleapis.com/auth/drive.readonly']

# Authenticate and create the Drive API client
creds = None
if os.path.exists('token.pickle'):
    with open('token.pickle', 'rb') as token:
        creds = pickle.load(token)
if not creds or not creds.valid:
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
    else:
        flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
        creds = flow.run_local_server(port=0)
    with open('token.pickle', 'wb') as token:
        pickle.dump(creds, token)

service = build('drive', 'v3', credentials=creds)

# Replace with your folder ID
folder_id = "1xpO19b1cIvR3-JFD06xTZQ-IoDitQllj"  

# Query files in the folder
results = service.files().list(
    q=f"'{folder_id}' in parents",
    fields="files(id, name)"
).execute()
files = results.get('files', [])

# Create the output directory
output_dir = "data/raw"
os.makedirs(output_dir, exist_ok=True)

# Download each file
for file in files:
    file_id = file['id']
    file_name = file['name']
    request = service.files().get_media(fileId=file_id)
    fh = io.FileIO(f"{output_dir}/{file_name}", 'wb')
    downloader = MediaIoBaseDownload(fh, request)
    done = False
    while done is False:
        status, done = downloader.next_chunk()
        print(f"Downloaded {file_name}: {int(status.progress() * 100)}%")

print("All files downloaded successfully!")