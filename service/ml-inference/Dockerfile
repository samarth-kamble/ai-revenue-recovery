FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy python dependencies
COPY service/ml-inference/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy ML models and service source code
COPY ml/models /app/ml/models
COPY service/ml-inference /app/service/ml-inference

WORKDIR /app/service/ml-inference

EXPOSE 5001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5001"]
