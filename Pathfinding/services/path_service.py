# from ..algorithms.a_star import AStar
# from ..models.bc_grid import BCGrid

from algorithms.a_star import AStar
from models.bc_grid import BCGrid

class PathService:
    def __init__(self):
        self.grid = BCGrid()

    
    def process_detection(self, lat, lon):
        """Main processing pipeline"""

        if not self.grid.load():
            return {"error": "Grid is not properly loaded, data is missing."}

        print('PYTHON HERE')

        x, y = self._latlon_to_grid(lat, lon)
   
        if not self._validate_coordinates(x, y):
            return {"error": "Coordinates outside BC grid"}
        
        if not self.grid.add_fire(x, y):
            return {"error": "Invalid fire location"}
        
        hospital = self.grid.find_nearest_hospital(x, y)
        if not hospital:
            return {"error": "No hospitals available"}
        
        path = AStar.find_path(self.grid, (x, y), hospital)
        
        hospital_index = self._get_hospital_index(hospital)
        if hospital_index == -1:
            return {"error": "Hospital index not found"}
        
        return {
            "fire": [x, y],
            "hospital": list(hospital),
            "path": path,
            "grid_state": self.grid.grid.tolist(),
            "hospital_index": hospital_index
        }
    
    def _latlon_to_grid(self, lat, lon):
        """Convert geographic to grid coordinates"""
        x_scale = (lon - self.grid.bounds["min_lon"]) / (self.grid.bounds["max_lon"] - self.grid.bounds["min_lon"])
        y_scale = (lat - self.grid.bounds["min_lat"]) / (self.grid.bounds["max_lat"] - self.grid.bounds["min_lat"])
        return (
            int(x_scale * (self.grid.width - 1)),
            int((1 - y_scale) * (self.grid.height - 1))  # Flip y-axis
        )
    
    def _validate_coordinates(self, x, y):
        return (0 <= x < self.grid.width and 
                0 <= y < self.grid.height)
    
    def _get_hospital_index(self, hospital):
        """
        Given a hospital coordinate (x, y), find its index in self.grid.hospitals
        """
        # for idx, coords in enumerate(self.grid.hospitals):
        #     if coords == tuple(hospital):
        #         return idx
        # return -1
    
        for idx, coords in enumerate(self.grid.hospitals):
            if all(abs(a - b) < 1e-6 for a, b in zip(coords, hospital)):
                return idx
        return -1