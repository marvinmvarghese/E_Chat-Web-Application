FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy full project
COPY . .

# Make start script executable
RUN chmod +x start.sh

# Expose port
EXPOSE 10000

# Run migrations then start the server
CMD ["bash", "start.sh"]
