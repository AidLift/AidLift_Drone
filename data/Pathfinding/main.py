import osmnx as ox

# Define the area (e.g., a city or region)
place_name = "British Columbia, Canada"

# Fetch the road network graph
graph = ox.graph_from_place(place_name, network_type="drive")

# Plot the graph
ox.plot_graph(graph)