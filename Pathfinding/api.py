from flask import Flask, request, jsonify
from flask_cors import CORS
import json
from pathlib import Path

from services.path_service import PathService

# path_service = None
path_service = PathService()


app = Flask(__name__)

CORS(app)

@app.route('/')
def home():
    return "Hello, world!"


# @app.route('/hospitals', methods=['POST'])
# def receive_hospitals():
#     global path_service
#     data = request.get_json()

#     if 'hospitals' not in data:
#         return jsonify({"error": "Missing hospitals"}), 400

#     hospitals = data['hospitals']

#     # Reinitialize the PathService with real hospitals
#     path_service = PathService(hospitals=hospitals)

#     return jsonify({"message": "Hospitals received", "count": len(hospitals)})

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


@app.route('/detect-fire', methods=['POST'])
def detect_fire():
    try:
        data = request.get_json()
        print(f"Received data: {data}")  # Debug print
        
        # Validate input
        if not data or 'latitude' not in data or 'longitude' not in data:
            return jsonify({"error": "Missing coordinates"}), 400
        
        # Dummy response for testing
        response = {
            "status": "success",
            "received": data,
            "test_data": {
                "fire": [45, 67],
                "hospital": [52, 71],
                "path": [[46,67], [47,68]]
            }
        }


        lat = data['latitude']
        lon = data['longitude']

        result = path_service.process_detection(lat, lon)
        
        # return jsonify(response)
        return jsonify(result)
    
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
