import zipfile
import os

zip_path = './backend/bin/nano_x64.zip'
extract_path = './backend/bin/temp_nano_x64'

try:
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(extract_path)
    print("Extraction successful")
except Exception as e:
    print(f"Extraction failed: {e}")
