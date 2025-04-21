import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from model_architechture import ConvNet  
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import torch
from torchvision import transforms
from PIL import Image
import os
import cv2
import numpy as np
import json
from pathlib import Path
from flask_cors import CORS
from services.path_service import PathService




app = Flask(__name__)

CORS(app)

# Configuration
UPLOAD_FOLDER = 'tmp_uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'mp4'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


class FireDetector:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        # Load model architecture
        self.model = ConvNet(num_classes=2).to(self.device)
        
        # Load trained weights
        self.model.load_state_dict(torch.load("models/best_model.pth", map_location=self.device))
        self.model.eval()

    # def predict(self, image):
    #     img_tensor = transform(image).unsqueeze(0).to(self.device)
    #     with torch.no_grad():
    #         output = self.model(img_tensor)
    #         probs = torch.softmax(output, dim=1)
    #         fire_prob = probs[0][1].item()
    #     return fire_prob > 0.5, fire_prob


    def predict(self, image):
        img_tensor = transform(image).unsqueeze(0).to(self.device)
        print(f"🧪 Tensor stats — min: {img_tensor.min().item():.4f}, max: {img_tensor.max().item():.4f}, mean: {img_tensor.mean().item():.4f}")
        with torch.no_grad():
            output = self.model(img_tensor)
            probs = torch.softmax(output, dim=1)

            # Log the full probability distribution
            print("🔥 Class Probabilities:", probs.cpu().numpy())

            # fire_prob = probs[0][1].item()
            # not_fire_prob = probs[0][0].item()

            fire_prob = probs[0][0].item()  # ✅ Index 0 = fire class
            not_fire_prob = probs[0][1].item()
            # Log individual class confidence
            print(f"🔥 Fire Probability: {fire_prob:.4f}")
            print(f"❄️ Not-Fire Probability: {not_fire_prob:.4f}")

        # You can change this threshold if needed (e.g., fire_prob > 0.8)
        return fire_prob > 0.5, fire_prob
    
# Image transforms
transform = transforms.Compose([
    transforms.Resize((256, 256)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# Initialize components
model = FireDetector()

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def process_image(image_path):
    """Analyze single image for fire"""
    # img = Image.open(image_path).convert("RGB")
    img = Image.open(image_path)
    is_fire, confidence = model.predict(img)
    return is_fire, confidence

def process_video(video_path):
    """Analyze video by sampling key frames"""
    cap = cv2.VideoCapture(video_path)
    fire_frames = 0
    total_frames = 0
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        total_frames += 1
        if total_frames % 10 == 0:  # Analyze every 10th frame
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            img = Image.fromarray(frame_rgb)
            is_fire, _ = model.predict(img)
            if is_fire:
                fire_frames += 1
    
    cap.release()
    confidence = fire_frames / max(1, (total_frames // 10))
    return fire_frames > 0, confidence

def generate_escape_path(lat, lon, hospital_data, grid_data):
    """Mock pathfinding - replace with your A* implementation"""
    path_service = PathService()

    pathserv = path_service.process_detection(lat, lon, hospital_data, grid_data)
    return {
        "fire": [int(lat*100)%90, int(lon*100)%90],  # Mock grid coords
        "hospital": [int(lat*100)%90 + 7, int(lon*100)%90 + 4],
        "path": pathserv["path"],
        "hospital_index": pathserv["hospital_index"],
        "distance_km": round(abs(lat - lon) * 110, 2),
    }
    return {
        "fire": [int(lat*100)%90, int(lon*100)%90],  # Mock grid coords
        "hospital": [int(lat*100)%90 + 7, int(lon*100)%90 + 4],
        "path": [
            [int(lat*100)%90 + i, int(lon*100)%90 + i] 
            for i in range(1, 6)
        ],
        "distance_km": round(abs(lat - lon) * 110, 2)
    }


@app.route('/detect-fire', methods=['POST'])
def detect_fire():
    try:
        # Handle media upload
        print(1)
        if 'media' in request.files:
            print(2)

            file = request.files['media']
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(filepath)
                
                # Process media
                if file.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                    print(3)
                    
                    # is_fire, confidence = process_image(filepath)
                    try:
                        print(4)
                        is_fire, confidence = process_image(filepath)
                        print("is_fire:", is_fire)
                    except Exception as e:
                        print("🔥 Error inside process_image:", str(e))

                else:
                    is_fire, confidence = process_video(filepath)
                    print("is_fire:", is_fire)


                
                # Clean up
                os.remove(filepath)
                
                if not is_fire:
                    return jsonify({
                        "status": "success",
                        "fire_detected": False,
                        "confidence": f"{confidence:.0%}"
                    })
        
        # Get coordinates (from form or JSON)
        lat = float(request.form.get('latitude') or 
                   request.json.get('latitude'))
        lon = float(request.form.get('longitude') or 
                   request.json.get('longitude'))


        # lat = float(request.form.get('latitude'))
        # lon = float(request.form.get('longitude'))
        print(lat,'lat')
        print(lon,'long')
        
        # hospital_data = request.json.get('hospitalData')
        # grid_data = request.json.get('gridData')
        # hospital_data = request.form.get('hospitalData') or request.json.get('hospitalData')
        # grid_data = request.form.get('gridData') or request.json.get('gridData')
        
        # hospital_data = json.loads(request.form.get('hospitalData')) or request.json.get('hospitalData')
        # grid_data = json.loads(request.form.get('gridData')) or request.json.get('gridData')
        
        try:
            hospital_data = json.loads(request.form.get('hospitalData')) if request.form.get('hospitalData') else request.json.get('hospitalData')
            grid_data = json.loads(request.form.get('gridData')) if request.form.get('gridData') else request.json.get('gridData')
        except json.JSONDecodeError:
            return jsonify({"error": "Invalid JSON data for hospitalData or gridData"}), 400
        
        # Generate emergency response
        path_data = generate_escape_path(lat, lon, hospital_data, grid_data)
        print(path_data["hospital_index"], ' hospindex')

        response = {
            "status": "success",
            "emergency": True,
            "user_location": [lat, lon],
            "fire_location": path_data["fire"],
            "nearest_hospital": {
                "grid": path_data["hospital"],
                "distance": f"{path_data['distance_km']} km"
            },
            "escape_route": path_data["path"],
            "confidence": f"{confidence if 'confidence' in locals() else 95:.0%}",
            "hospital_index" : path_data["hospital_index"]
        }
        return jsonify(response)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    



@app.route('/save-hospitals', methods=['POST'])
def save_hospitals():
    # Get the JSON data from the request
    try:
        hospitals_data = request.get_json()['hospitals']
        save_path = Path("data/bc_grid")
        save_path.mkdir(parents=True, exist_ok=True) 
 
        # Write to hospitals.json file
        with open(save_path / 'hospitals.json', 'w') as f:
            json.dump(hospitals_data, f, indent=4)
 
        return jsonify({"message": "Hospitals data saved successfully!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/save-grid-info', methods=['POST'])
def save_grid_info():
    try:
        grid_data = request.get_json()
        
        bounds = grid_data['bounds']
        dimensions = grid_data['dimensions']

        # Define where to save the grid info
        save_path = Path("data/bc_grid")
        save_path.mkdir(parents=True, exist_ok=True)
        
        # Write to grid_info.json file
        with open(save_path / 'grid.config.json', 'w') as f:
            json.dump(grid_data, f, indent=4)
        
    
        return jsonify({
            "message": "Grid info saved successfully!",
            "bounds": bounds,
            "dimensions": dimensions
        }), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000)) 
    app.run(host='0.0.0.0', port=port, debug=False)
    # app.run(host='0.0.0.0', port=5000, debug=True)

@app.route('/get-hospitals', methods=['GET'])
def get_hospitals():
    try:
        with open("data/bc_grid/hospitals.json", "r") as f:
            hospitals = json.load(f)
        return jsonify({"hospitals": hospitals}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/sync-hospitals', methods=['GET'])
def sync_hospitals():
    try:
        # 1. Fetch hospital data from Server A
        response = requests.get("https://aidlift-drone.onrender.com/get-hospitals")
        if response.status_code != 200:
            return jsonify({"error": "Failed to fetch from Server A"}), 500

        hospitals_data = response.json()['hospitals']

        # 2. Save to local hospitals.json
        save_path = Path("data/bc_grid")
        save_path.mkdir(parents=True, exist_ok=True)
        with open(save_path / 'hospitals.json', 'w', encoding='utf-8') as f:
            json.dump(hospitals_data, f, indent=4, ensure_ascii=False)

        return jsonify({"message": " Hospitals synced from Server A"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    
    
