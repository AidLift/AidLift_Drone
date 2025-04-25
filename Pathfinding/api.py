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
from Pathfinding.Pathfinder import get_nearest_nodes, run_astar, path_to_coordinates
import osmnx as ox


app = Flask(__name__)

CORS(app)

# Configuration
UPLOAD_FOLDER = 'tmp_uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'mp4', 'mov'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


class FireDetector:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        # Load model architecture
        self.model = ConvNet(num_classes=2).to(self.device)
        self.model.load_state_dict(torch.load("models/best_model_extended.pth", map_location=self.device))
        self.model.eval()

    def predict(self, image):
        img_tensor = transform(image).unsqueeze(0).to(self.device)
        print(f"🧪 Tensor stats — min: {img_tensor.min().item():.4f}, max: {img_tensor.max().item():.4f}, mean: {img_tensor.mean().item():.4f}")
        with torch.no_grad():
            output = self.model(img_tensor)
            probs = torch.softmax(output, dim=1)

            # Log the full probability distribution
            print("🔥 Class Probabilities:", probs.cpu().numpy())

            fire_prob = probs[0][1].item() 
            not_fire_prob = probs[0][0].item()

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

    with Image.open(image_path) as img:
        img.load()
        img_copy = img.copy()
        # is_fire, confidence = model.predict(img)
    is_fire, confidence = model.predict(img_copy)
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
        "fire": [int(lat*100)%90, int(lon*100)%90], 
        "hospital": pathserv["path"][-1],
        "path": pathserv["path"],
        "hospital_index": pathserv["hospital_index"],
        "distance_km": round(abs(lat - lon) * 110, 2),
    }


def grid_to_latlon(coords, grid_data):
    min_lat = grid_data['bounds']['min_lat']
    max_lat = grid_data['bounds']['max_lat']
    min_lon = grid_data['bounds']['min_lon']
    max_lon = grid_data['bounds']['max_lon']
    
    width = grid_data['dimensions']['width']
    height = grid_data['dimensions']['height']

    x, y = coords
    lat = max_lat - (y / height) * (max_lat - min_lat)
    lon = min_lon + (x / width) * (max_lon - min_lon)

    return (lat, lon)

G = ox.graph_from_place("Montréal, Quebec, Canada", network_type="drive", retain_all=True, simplify=True)
G = ox.project_graph(G, to_crs='epsg:4326')

def get_road_route(start_coords, end_coords):
    try:
        start_coords = tuple(start_coords)
        end_coords = tuple(end_coords)

        start_node, end_node = get_nearest_nodes(G, start_coords, end_coords)
        print("Start node:", start_node)
        print("End node:", end_node)

        path = run_astar(G, start_node, end_node)

        if not path:
            return None

        return path_to_coordinates(G, path)

    except Exception as e:
        print("Route error:", e)
        return None

def convert_path_to_latlon(path_data, grid_data):
    return [grid_to_latlon(point, grid_data) for point in path_data["path"]]

@app.route('/detect-fire', methods=['POST'])
def detect_fire():
    try:
        # Handle media upload
        if 'media' in request.files:

            file = request.files['media']
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(filepath)

                is_fire = False
                confidence = 0.0
                
                # Process media
                if file.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                    try:
                        is_fire, confidence = process_image(filepath)
                        print("is_fire:", is_fire)
                    except Exception as e:
                        print("🔥 Error inside process_image:", str(e))

                else:
                    try:
                        is_fire, confidence = process_video(filepath)
                    except Exception as e:
                        print("🔥 Error inside process_video:", str(e))
                
                # Clean up
                if os.path.exists(filepath):
                    os.remove(filepath)
                else:
                    print(f"File not found: {filepath}")
                

                if not is_fire:
                    return jsonify({
                        "status": "success",
                        "fire_detected": False,
                        "confidence": f"{confidence:.0%}"
                    })
        
        try:
            # Get coordinates (from form or JSON)
            lat = float(request.form.get('latitude') or 
                    request.json.get('latitude'))
            lon = float(request.form.get('longitude') or 
                    request.json.get('longitude'))
            
            hospital_data = json.loads(request.form.get('hospitalData')) if request.form.get('hospitalData') else request.json.get('hospitalData')
            grid_data = json.loads(request.form.get('gridData')) if request.form.get('gridData') else request.json.get('gridData')
        except json.JSONDecodeError:
            return jsonify({"error": "Invalid JSON data for hospitalData or gridData"}), 400
        
        # Generate emergency response
        path_data = generate_escape_path(lat, lon, hospital_data, grid_data)

        # Converted version of the escape path in the case that they're not in montreal
        escape_path_no_roads = convert_path_to_latlon(path_data, grid_data)

        # Get the road route for the nearest hospital
        nearest_hospital_latlon = grid_to_latlon(path_data["hospital"], grid_data)
        road_route = get_road_route([lat, lon], nearest_hospital_latlon)

        response = {
            "status": "success",
            "emergency": True,
            "user_location": [lat, lon],
            "fire_location": path_data["fire"],
            "nearest_hospital": {
                "grid": path_data["hospital"],
                "coords" : nearest_hospital_latlon,
                "distance": f"{path_data['distance_km']} km"
            },
            "escape_route": escape_path_no_roads,
            "road_route": road_route,
            "confidence": f"{confidence if 'confidence' in locals() else 95:.0%}",
            "hospital_index" : path_data["hospital_index"]
        }
        return jsonify(response)
    
    except Exception as e:
        import traceback 
        print("🔥 Full error traceback:")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify if the app is responsive."""
    try:
        return jsonify({
            "status": "success",
            "message": "App is up and running"
        }), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

# if __name__ == '__main__':
#     port = int(os.environ.get('PORT', 5001))
#     app.run(host='0.0.0.0', port=port)
