import heapq
from math import sqrt

class AStar:
    @staticmethod
    def heuristic(a, b):
        """Euclidean distance heuristic"""
        return sqrt((a[0] - b[0])**2 + (a[1] - b[1])**2)
    
    @staticmethod
    def find_path(grid, start, end):
        """Find path from start to end coordinates"""
        open_set = []
        heapq.heappush(open_set, (0, start[0], start[1]))
        
        came_from = {}
        g_score = {start: 0}
        f_score = {start: AStar.heuristic(start, end)}
        
        while open_set:
            _, current_x, current_y = heapq.heappop(open_set)
            current = (current_x, current_y)
            
            if current == end:
                path = []
                while current in came_from:
                    path.append(current)
                    current = came_from[current]
                return path[::-1]  # Return reversed path
            
            for dx, dy in [(0,1), (1,0), (0,-1), (-1,0)]:  # 4-directional
                neighbor = (current[0] + dx, current[1] + dy)
                
                if not grid.is_traversable(*neighbor):
                    continue
                
                tentative_g = g_score[current] + 1
                
                if neighbor not in g_score or tentative_g < g_score[neighbor]:
                    came_from[neighbor] = current
                    g_score[neighbor] = tentative_g
                    f_score[neighbor] = tentative_g + AStar.heuristic(neighbor, end)
                    heapq.heappush(open_set, (f_score[neighbor], neighbor[0], neighbor[1]))
        
        return None  # No path found