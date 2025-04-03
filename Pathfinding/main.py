import heapq
import math
import networkx as nx
import matplotlib.pyplot as plt

def heuristic(a, b):
    # Euclidean distance heuristic
    return math.sqrt((a[0] - b[0])**2 + (a[1] - b[1])**2)

def a_star(graph, start, goal, locations):
    open_list = []
    heapq.heappush(open_list, (0, start))
    came_from = {}
    cost_so_far = {start: 0}
    path = []  # Initialize path as empty list

    while open_list:
        _, current = heapq.heappop(open_list)

        if current == goal:
            # Reconstruct path only if we reached the goal
            while current in came_from:
                path.append(current)
                current = came_from[current]
            path.append(start)
            path.reverse()
            return path

        for neighbor, distance in graph[current].items():
            new_cost = cost_so_far[current] + distance
            if neighbor not in cost_so_far or new_cost < cost_so_far[neighbor]:
                cost_so_far[neighbor] = new_cost
                priority = new_cost + heuristic(locations[neighbor], locations[goal])
                heapq.heappush(open_list, (priority, neighbor))
                came_from[neighbor] = current
    
    return path  # Return empty path if no solution found

def draw_graph(graph, path):
    G = nx.DiGraph()

    for node, edges in graph.items():
        for neighbor, weight in edges.items():
            G.add_edge(node, neighbor, weight=weight)

    pos = nx.spring_layout(G)
    labels = nx.get_edge_attributes(G, 'weight')

    nx.draw(G, pos, with_labels=True, node_color='lightblue', edge_color='gray')
    nx.draw_networkx_edge_labels(G, pos, edge_labels=labels)

    # Highlight the path
    path_edges = list(zip(path, path[1:]))
    nx.draw_networkx_edges(G, pos, edgelist=path_edges, edge_color='red', width=2)

    plt.show()

# Example usage
if __name__ == "__main__":
    locations = {
        'Disaster_Location': (0, 0),
        'Hospital_A': (2, 3),
        'Hospital_B': (5, 1)
    }

    graph = {
        'Disaster_Location': {'Hospital_A': 5, 'Hospital_B': 10},
        'Hospital_A': {'Hospital_B': 3},
        'Hospital_B': {}
    }

    # Find path
    path = a_star(graph, 'Disaster_Location', 'Hospital_A', locations)
    print("Shortest path:", path)
    
    # Visualize
    draw_graph(graph, path)