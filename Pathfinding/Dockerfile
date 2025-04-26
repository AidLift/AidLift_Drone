FROM python:3.11

WORKDIR /app

# Pre-install pip upgrade and critical dependencies
RUN python -m pip install --upgrade pip setuptools wheel

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY download_model.py .
RUN python download_model.py

COPY . .

EXPOSE 5001
CMD ["python", "api.py", "--host", "0.0.0.0", "--port", "5001"]