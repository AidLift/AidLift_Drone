        # Load trained weights
        # state_dict = torch.load("models/best_model_extended.pth", map_location=self.device)
        # self.model.load_state_dict(state_dict, strict=False)


    # def predict(self, image):
    #     img_tensor = transform(image).unsqueeze(0).to(self.device)
    #     with torch.no_grad():
    #         output = self.model(img_tensor)
    #         probs = torch.softmax(output, dim=1)
    #         fire_prob = probs[0][1].item()
    #     return fire_prob > 0.5, fire_prob




# @app.route('/save-hospitals', methods=['POST'])
# def save_hospitals():
#     # Get the JSON data from the request
#     try:
#         hospitals_data = request.get_json()['hospitals']
#         save_path = Path("data/bc_grid")
#         save_path.mkdir(parents=True, exist_ok=True) 
 
#         # Write to hospitals.json file
#         with open(save_path / 'hospitals.json', 'w') as f:
#             json.dump(hospitals_data, f, indent=4)
 
#         return jsonify({"message": "Hospitals data saved successfully!"}), 200
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500


# @app.route('/save-grid-info', methods=['POST'])
# def save_grid_info():
#     try:
#         grid_data = request.get_json()
        
#         bounds = grid_data['bounds']
#         dimensions = grid_data['dimensions']

#         # Define where to save the grid info
#         save_path = Path("data/bc_grid")
#         save_path.mkdir(parents=True, exist_ok=True)
        
#         # Write to grid_info.json file
#         with open(save_path / 'grid.config.json', 'w') as f:
#             json.dump(grid_data, f, indent=4)
        
    
#         return jsonify({
#             "message": "Grid info saved successfully!",
#             "bounds": bounds,
#             "dimensions": dimensions
#         }), 200
    
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500




# @app.route('/api/get-path', methods=['POST'])
# def get_path():
#     try:
#         data = request.get_json()
#         start_coords = tuple(data['start'])
#         end_coords = tuple(data['end'])

#         print(start_coords)
#         print(end_coords)
#         # Load the street graph (you can optimize later by caching)

#         # Get nearest nodes
#         start_node, end_node = get_nearest_nodes(G, start_coords, end_coords)
#         print("Start node:", start_node)
#         print("End node:", end_node)

#         # Run A*
#         path = run_astar(G, start_node, end_node)

#         if not path:
#             return jsonify({'error': 'No path found'}), 404

#         route_coords = path_to_coordinates(G, path)

#         return jsonify({'route': route_coords})

#     except Exception as e:
#         return jsonify({'error': str(e)}), 500
    

    # app.run(host='0.0.0.0', port=5000, debug=True)

# @app.route('/get-hospitals', methods=['GET'])
# def get_hospitals():
#     try:
#         with open("data/bc_grid/hospitals.json", "r") as f:
#             hospitals = json.load(f)
#         return jsonify({"hospitals": hospitals}), 200
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

# @app.route('/sync-hospitals', methods=['GET'])
# def sync_hospitals():
#     try:
#         # 1. Fetch hospital data from Server A
#         response = requests.get("https://aidlift-drone.onrender.com/get-hospitals")
#         if response.status_code != 200:
#             return jsonify({"error": "Failed to fetch from Server A"}), 500

#         hospitals_data = response.json()['hospitals']

#         # 2. Save to local hospitals.json
#         save_path = Path("data/bc_grid")
#         save_path.mkdir(parents=True, exist_ok=True)
#         with open(save_path / 'hospitals.json', 'w', encoding='utf-8') as f:
#             json.dump(hospitals_data, f, indent=4, ensure_ascii=False)

#         return jsonify({"message": " Hospitals synced from Server A"}), 200

#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

    
    
