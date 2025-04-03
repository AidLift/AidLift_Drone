"""
BC Road Network Downloader
Downloads British Columbia's road network in optimized chunks
"""

import osmnx as ox
from shapely.geometry import box
import matplotlib.pyplot as plt
from tqdm import tqdm
import geopandas as gpd

# ========================
# 1. BC REGION DEFINITIONS
# ========================
bc_chunks = [
    # Lower Mainland (Vancouver + Fraser Valley)
    {"name": "lower_mainland", "north": 49.7, "south": 48.9, "west": -123.6, "east": -121.4},
    
    # Vancouver Island
    {"name": "vancouver_island", "north": 51.0, "south": 48.2, "west": -127.5, "east": -123.0},
    
    # Okanagan Valley
    {"name": "okanagan", "north": 51.0, "south": 49.0, "west": -121.5, "east": -118.5},
    
    # Kootenays
    {"name": "kootenays", "north": 51.5, "south": 48.8, "west": -118.5, "east": -114.0},
    
    # Cariboo-Chilcotin
    {"name": "cariboo", "north": 53.5, "south": 51.0, "west": -125.0, "east": -120.5},
    
    # Northern Coast
    {"name": "north_coast", "north": 55.5, "south": 52.5, "west": -132.0, "east": -125.0},
    
    # Peace River Region
    {"name": "peace_river", "north": 60.0, "south": 55.0, "west": -130.0, "east": -119.0},
    
    # Thompson-Nicola
    {"name": "thompson", "north": 51.5, "south": 49.5, "west": -121.5, "east": -119.0}
]

# ========================
# 2. DOWNLOAD FUNCTION
# ========================
def download_bc_roads():
    """Downloads all BC regions as separate GraphML files"""
    ox.settings(timeout=1200, memory=10_000_000, log_console=True)
    
    for region in tqdm(bc_chunks, desc="Downloading BC Regions"):
        try:
            bbox = box(region["west"], region["south"], region["east"], region["north"])
            cf = ('["highway"~"motorway|trunk|primary|secondary|'
                  'tertiary|motorway_link|trunk_link|primary_link|'
                  'secondary_link|tertiary_link|ferry"]')
            
            G = ox.graph_from_polygon(
                bbox,
                custom_filter=cf,
                retain_all=True,
                simplify=True
            )
            
            G = ox.utils_graph.remove_isolated_nodes(G)
            ox.save_graphml(G, f"bc_{region['name']}_roads.graphml")
            
        except Exception as e:
            print(f"\nFailed {region['name']}: {str(e)}")
            continue

# ========================
# 3. VISUALIZATION
# ========================
def plot_region(name):
    """Plots a single downloaded region"""
    try:
        G = ox.load_graphml(f"bc_{name}_roads.graphml")
        fig, ax = plt.subplots(figsize=(10, 10))
        ox.plot_graph(G, ax=ax, node_size=0, edge_linewidth=0.5)
        plt.title(f"BC Roads: {name.replace('_', ' ').title()}")
        plt.show()
    except FileNotFoundError:
        print(f"No data found for {name}. Download it first.")

# ========================
# 4. MAIN EXECUTION
# ========================
if __name__ == "__main__":
    print("=== BC Road Network Downloader ===")
    download_bc_roads()
    
    # Uncomment to test visualization
    # plot_region("lower_mainland")