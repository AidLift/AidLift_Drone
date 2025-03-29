try:
    from flask import Flask, request, jsonify
    print("Flask imported successfully")
except ImportError:
    print("Error: Flask not installed. Run 'pip install flask'")

app = Flask(__name__)

@app.route('/')
def health_check():
    return jsonify({"status": "ready"})

if __name__ == '__main__':
    app.run(port=5000)