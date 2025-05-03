"""
ASGI config for profevardilla project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os
import asyncio
import logging
import psutil
from django.core.asgi import get_asgi_application

def log_system_resources():
    cpu_cores = psutil.cpu_count(logical=False)
    cpu_threads = psutil.cpu_count(logical=True)
    cpu_usage = psutil.cpu_percent(interval=1)

    mem = psutil.virtual_memory()
    mem_total_gb = round(mem.total / (1024 ** 3), 2)
    mem_available_gb = round(mem.available / (1024 ** 3), 2)

    logger.info(f"CPU Cores (Physical/Threads): {cpu_cores}/{cpu_threads}")
    logger.info(f"CPU Usage: {cpu_usage}%")
    logger.info(f"Memory (Total/Available): {mem_total_gb}GB / {mem_available_gb}GB")
    logger.info(f"Running in Docker: {os.path.exists('/.dockerenv')}")
    
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'profevardilla.settings')
logger = logging.getLogger("uvicorn.info")
loop_policy = asyncio.get_event_loop_policy()
logger.info(f"Event loop policy: {loop_policy.__class__.__name__}")
log_system_resources()
application = get_asgi_application()