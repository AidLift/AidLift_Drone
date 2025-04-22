import os
import gdown

# Define the models folder
models_folder = "models"

# Ensure the models folder exists
if not os.path.exists(models_folder):
    os.makedirs(models_folder)

# Google Drive file ID (get it from the shareable link)
file_id = '1kI0P8QFgpY6GJsSKKoA1V6wPcpC0Vi_t'  # Updated file ID
url = f'https://drive.google.com/uc?export=download&id={file_id}'

# Define the file path where the model will be saved
model_file_path = os.path.join(models_folder, "best_model_extended.pth")

# Download the model file from Google Drive
gdown.download(url, model_file_path, quiet=False)

print(f"Model file downloaded at {model_file_path}")
