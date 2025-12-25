#!/bin/bash
source venv/bin/activate
echo "Starting Server on http://0.0.0.0:8000"
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
