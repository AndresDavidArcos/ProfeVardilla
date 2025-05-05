#!/bin/bash
echo "Preparing HF models"
python -c "from transformers import AutoModel; AutoModel.from_pretrained('intfloat/multilingual-e5-small')"
python -c "from sentence_transformers import CrossEncoder; CrossEncoder('cross-encoder/ms-marco-MiniLM-L-12-v2')"
echo "HF models ready"
sudo python -m gunicorn profevardilla.wsgi:application --bind 0.0.0.0:80 --timeout 160 --preload --access-logfile - --error-logfile - --worker-tmp-dir /dev/shm  
#python -m uvicorn profevardilla.asgi:application --host 0.0.0.0 --port 8000 --worker-tmp-dir /dev/shm
#python manage.py runserver 0.0.0.0:8000
#Alibaba-NLP/gte-Qwen2-1.5B-instruct