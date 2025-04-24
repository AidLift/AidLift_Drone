import osmnx as ox
import networkx as nx


# Turn on logging and caching (optional)
ox.settings.log_console = True
ox.settings.use_cache = True

# Replace with your target area
# place_name = "Montréal, Quebec, Canada"

# Download driveable road network
# G = ox.graph_from_place(place_name, network_type='drive')

# Optional: Save it for reuse later
# ox.save_graphml(G, "montreal_street_graph.graphml")

def get_nearest_nodes(graph, start_coords, end_coords):
    """
    Convert (lat, lon) pairs to nearest nodes in the street graph
    """
    orig_node = ox.distance.nearest_nodes(graph, X=start_coords[1], Y=start_coords[0])
    dest_node = ox.distance.nearest_nodes(graph, X=end_coords[1], Y=end_coords[0])
    return orig_node, dest_node


def run_astar(graph, start_node, end_node):
    """
    Run A* pathfinding on the graph from start_node to end_node.
    Returns the list of nodes in the path.
    """
    try:
        path = nx.astar_path(graph, start_node, end_node, weight='length')
        return path
    except nx.NetworkXNoPath:
        print("No path found.")
        return None
    


def path_to_coordinates(graph, path):
    """
    Convert a list of node IDs into a list of (lat, lon) coordinate pairs.
    """
    return [(graph.nodes[n]['y'], graph.nodes[n]['x']) for n in path]