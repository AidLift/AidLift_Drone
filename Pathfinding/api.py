from flask import Flask, request, jsonify

app = Flask(__name__)

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
        return jsonify(response)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
