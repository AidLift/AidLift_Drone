from flask import Flask, request, jsonify
import os
app = Flask(__name__)

@app.route('/run-ai', methods=['POST'])
def run_ai():
    data = request.json
    input = data.get("input", "")

    output = f"AI processed: {input}"


    return jsonify({"output": output})

if __name__ == '__main__':
    app.run(debug=True)