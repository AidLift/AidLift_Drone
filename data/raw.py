import gdown
import zipfile

file_id = "1xpO19b1cIvR3-JFD06xTZQ-IoDitQllj?usp=drive_link"
url = "https://drive.google.com/drive/folders/1xpO19b1cIvR3-JFD06xTZQ-IoDitQllj?usp=drive_link"
output = "data/raw/the-wildfire-dataset.zip"

with zipfile.ZipFile(output, 'r') as zip_ref:
    zip_ref.extractall("data/raw/")
print("File extracted successfully!")

