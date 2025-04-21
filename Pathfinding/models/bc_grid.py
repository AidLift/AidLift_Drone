import json
import numpy as np
from pathlib import Path


class BCGrid:
    def __init__(self, data_dir="data/bc_grid"):
        self.data_dir = Path(data_dir).resolve()
        self.grid = None
       

    def load(self, hospital_data, grid_data):
        """Method to load the config, hospitals, and obstacles and initialize the grid"""        
        # config_path = self.data_dir / "grid.config.json"
        # hospitals_path = self.data_dir / "hospitals.json"
        # obstacles_path = self.data_dir / "obstacles.json"

        print(hospital_data, 'hospital data')
        print(grid_data, 'grid data')
        print('WE IN DA LOAD HERE')

        
        # Load all necessary data
        self.load_config(grid_data) 
        self.load_hospitals(hospital_data)
        # Use temp data for now
        obstacles = [
            [50,50], [150,150], [250,250], [350,350], [450,450]
        ]
        self.load_obstacles(obstacles)
        
        # self.load_config(self._load_json(config_path))
        # self.load_hospitals(self._load_json(hospitals_path))
        # self.load_obstacles(self._load_json(obstacles_path))
        
        # Initialize the grid after loading all data
        self._initialize_grid()

        return True



    def _load_json(self, path):
        if not path.exists():
            print(f"❌ File not found: {path}")
            return []

        print(f"📂 Loading file: {path}")
        with open(path, 'r') as f:
            return json.load(f)
        

    def _initialize_grid(self):
        """Create grid with hospitals and obstacles"""
        self.grid = np.zeros((self.height, self.width), dtype=np.uint8)
        # print('HOSPI',self.hospitals)
        
        # 0=empty, 1=obstacle, 2=hospital, 3=fire
        for x, y in self.hospitals:
            self.grid[y, x] = 2
        
            
        for x, y in self.obstacles:
            if 0 <= x < self.width and 0 <= y < self.height:
                self.grid[y, x] = 1
    
    # def load_config(self, config_path):
    #     with open(config_path) as f:
    #         config = json.load(f)
    #         self.width = config["dimensions"]["width"]
    #         self.height = config["dimensions"]["height"]
    #         self.bounds = config["bounds"]
    
    # def load_hospitals(self, hospitals_path):
    #     with open(hospitals_path) as f:
    #         self.hospitals = [tuple(h) for h in json.load(f)]
    
    # def load_obstacles(self, obstacles_path):
    #     with open(obstacles_path) as f:
    #         self.obstacles = [tuple(o) for o in json.load(f)]



    def load_config(self, config):
        """Load grid configuration from the passed dictionary"""
        print(1)
        print(config)


        self.width = config["dimensions"]["width"]
        self.height = config["dimensions"]["height"]
        self.bounds = config["bounds"]

        print('LOADED')
    

    def _validate_coordinates(self, x, y):
        """Validate if the given (x, y) coordinates are within grid bounds"""
        return 0 <= x < self.width and 0 <= y < self.height

    # def load_hospitals(self, hospitals):
    #     """Load hospitals from the passed list"""
    #     self.hospitals = []
    #     for hosp in hospitals:
    #         name = hosp['name']
    #         lat = hosp['lat']
    #         lon = hosp['lon']
            
    #         x, y = self.geo_to_grid(float(lat), float(lon))
    #         if self._validate_coordinates(x, y):
    #             self.hospitals.append((x, y))
    #         else:
    #             print(f"Skipping hospital {name} at ({lat}, {lon}) - out of bounds")

    def load_hospitals(self, hospitals):
        """Load hospitals from the passed list"""
        self.hospitals = []
        for hosp in hospitals:
            name = hosp['name']
            lat = hosp['lat']
            lon = hosp['lon']
            
            # Convert lat, lon to grid coordinates
            x, y = self.geo_to_grid(float(lat), float(lon))
            
            if self._validate_coordinates(x, y):
                self.hospitals.append((x, y))
            else:
                print(f"Skipping hospital {name} at ({lat}, {lon}) - out of bounds")

        
    
    def load_obstacles(self, obstacles):
        """Load obstacles from the passed list"""
        self.obstacles = [tuple(o) for o in obstacles]


    
    def is_traversable(self, x, y):
        """Check if cell can be pathfinded through"""
        return (0 <= x < self.width and 
                0 <= y < self.height and
                self.grid[y, x] in (0, 2))  # Allow moving through hospitals
    
    def add_fire(self, x, y):
        """Mark fire location on grid"""
        if self.is_traversable(x, y):
            self.grid[y, x] = 3
            return True
        return False
    
    def find_nearest_hospital(self, x, y):
        """Find closest hospital to given coordinates"""
        min_dist = float('inf')
        nearest = None
        
        for hx, hy in self.hospitals:
            dist = ((hx - x)**2 + (hy - y)**2)**0.5
            if dist < min_dist:
                min_dist = dist
                nearest = (hx, hy)
        
        return nearest
    
    def geo_to_grid(self, lat, lon):
        """Convert geographic coordinates to grid coordinates"""

        min_lat = self.bounds['min_lat']
        max_lat = self.bounds['max_lat']
        min_lon = self.bounds['min_lon']
        max_lon = self.bounds['max_lon']

        # Normalize lat/lon to 0-1 range
        x_ratio = (lon - min_lon) / (max_lon - min_lon)
        y_ratio = (lat - min_lat) / (max_lat - min_lat)

        # Flip Y because top-left corner is (0,0)
        y_ratio = 1 - y_ratio

        x = int(x_ratio * self.width)
        y = int(y_ratio * self.height)

        return x, y