from queue import Queue, Full, Empty
from config import APP_CONFIG
from services.logging_utils import get_logger

# ==============================
# CONFIG
# ==============================
MAX_QUEUE_SIZE = APP_CONFIG["queue"]["max_size"]


# ==============================
# MAIN QUEUE
# ==============================
job_queue = Queue(maxsize=MAX_QUEUE_SIZE)
logger = get_logger("queue")


# ==============================
# SAFE PUT (for scrapers)
# ==============================
def enqueue_job(job, timeout=5):
    try:
        job_queue.put(job, timeout=timeout)
        return True
    except Full:
        logger.warning("Queue is full. Dropping job: %s", job.get("job_title", "unknown"))
        return False


# ==============================
# SAFE GET (for workers)
# ==============================
def dequeue_job(timeout=5):
    try:
        return job_queue.get(timeout=timeout)
    except Empty:
        return None
