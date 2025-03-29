import json
import numpy as np
from pathlib import Path

class BCGrid:
    def __init__(self, data_dir="data/bc_grid"):
        self.load_config(Path(data_dir) / "grid_config.json")
        self.load_hospitals(Path(data_dir) / "hospitals.json")
        self.load_obstacles(Path(data_dir) / "obstacles.json")
        self._initialize_grid()
    
    def _initialize_grid(self):
        """Create grid with hospitals and obstacles"""
        self.grid = np.zeros((self.height, self.width), dtype=np.uint8)
        
        # 0=empty, 1=obstacle, 2=hospital, 3=fire
        for x, y in self.hospitals:
            self.grid[y, x] = 2
            
        for x, y in self.obstacles:
            if 0 <= x < self.width and 0 <= y < self.height:
                self.grid[y, x] = 1
    
    def load_config(self, config_path):
        with open(config_path) as f:
            config = json.load(f)
            self.width = config["dimensions"]["width"]
            self.height = config["dimensions"]["height"]
            self.bounds = config["bounds"]
    
    def load_hospitals(self, hospitals_path):
        with open(hospitals_path) as f:
            self.hospitals = [tuple(h) for h in json.load(f)]
    
    def load_obstacles(self, obstacles_path):
        with open(obstacles_path) as f:
            self.obstacles = [tuple(o) for o in json.load(f)]
    
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