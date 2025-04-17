import os
import requests

MODEL_URL = "https://drive.google.com/uc?export=download&id=1XrvOBVW-39XWLYGsJGZpTZ67SgAxSddw"
MODEL_PATH = "AidLift_Done/Pathfinding/models/best_model.pth"

def download_model():
    if not os.path.exists(MODEL_PATH):
        print("Downloading model from Google Drive...")
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        response = requests.get(MODEL_URL, stream=True)
        with open(MODEL_PATH, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
        print("Model downloaded!")
    else:
        print("Model already exists.")

if __name__ == "__main__":
    download_model()