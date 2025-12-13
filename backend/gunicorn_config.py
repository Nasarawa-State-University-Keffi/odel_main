"""
Gunicorn configuration file for production deployment.
"""
import multiprocessing
import os

# Server socket
bind = "0.0.0.0:8000"
backlog = 2048

# Worker processes
workers = int(os.environ.get('GUNICORN_WORKERS', multiprocessing.cpu_count() * 2 + 1))
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50
timeout = 120
keepalive = 5

# Worker process naming
proc_name = "lms"

# Server mechanics
daemon = False
pidfile = None
user = None
group = None
tmp_upload_dir = None

# Logging
accesslog = "-"  # Log to stdout
errorlog = "-"   # Log to stderr
loglevel = os.environ.get('GUNICORN_LOG_LEVEL', 'info')
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(L)s'

# Process naming
def worker_int(worker):
    """
    Called when a worker receives the INT or QUIT signal.
    """
    worker.log.info("Worker received INT or QUIT signal")

def on_starting(server):
    """
    Called just before the master process is initialized.
    """
    server.log.info("Starting Gunicorn server")

def on_reload(server):
    """
    Called to recycle workers during a reload via SIGHUP.
    """
    server.log.info("Reloading Gunicorn server")

def when_ready(server):
    """
    Called just after the server is started.
    """
    server.log.info("Gunicorn server is ready. Spawning workers")

def worker_abort(worker):
    """
    Called when a worker receives the SIGABRT signal.
    """
    worker.log.info("Worker received SIGABRT signal")
