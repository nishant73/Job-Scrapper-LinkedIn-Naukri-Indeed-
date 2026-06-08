import sqlite3
import hashlib
import threading
from config import APP_CONFIG

DB_PATH = str(APP_CONFIG["files"]["seen_jobs_db"])

# Thread-safe connection
conn = sqlite3.connect(DB_PATH, check_same_thread=False)
cursor = conn.cursor()
lock = threading.Lock()

# Create table
cursor.execute("""
CREATE TABLE IF NOT EXISTS seen_jobs (
    id TEXT PRIMARY KEY
)
""")
conn.commit()

def clear_seen_jobs():
    global cursor, conn

    with lock:
        cursor.execute("DELETE FROM seen_jobs")
        conn.commit()

    print("✅ Cleared seen_jobs cache")
# -------- HASH FUNCTION --------
def get_job_id(job_title, company_name, job_description):
    """
    Create stable unique ID
    """
    base = f"{job_title}_{company_name}_{job_description}"
    return hashlib.md5(base.encode()).hexdigest()

def hash_job_url(job_url):
    return hashlib.md5(job_url.encode()).hexdigest()

# -------- CHECK --------
def is_seen(job_id):
    with lock:
        cursor.execute("SELECT 1 FROM seen_jobs WHERE id=?", (job_id,))
        return cursor.fetchone() is not None

#-------- CHECK PASSED --------
def mark_passed(hash_url):
    with lock:
        cursor.execute(
            "INSERT OR IGNORE INTO seen_jobs (id) VALUES (?)",
            (hash_url,)
        )
        conn.commit()
def is_passed(hash_url):

    with lock:
        cursor.execute("SELECT 1 FROM seen_jobs WHERE id=?", (hash_url,))
        return cursor.fetchone() is not None
    
# -------- INSERT --------
def mark_seen(job_id):
    with lock:
        cursor.execute(
            "INSERT OR IGNORE INTO seen_jobs (id) VALUES (?)",
            (job_id,)
        )
        conn.commit()

# def get_all_seen_jobs():
#     with lock:
#         cursor.execute("SELECT id FROM seen_jobs")
#         return set(row[0] for row in cursor.fetchall())
    
