import time
import pandas as pd
import sqlite3
from config import APP_CONFIG
from services.logging_utils import get_logger

DB_PATH = str(APP_CONFIG["files"]["jobs_db"])
OUTPUT = str(APP_CONFIG["files"]["jobs_csv"])
DEFAULT_INTERVAL = APP_CONFIG["export"]["interval_seconds"]
logger = get_logger("export")

def export_loop(interval=DEFAULT_INTERVAL):
    while True:
        try:
            conn = sqlite3.connect(DB_PATH)  # NEW connection
            df = pd.read_sql_query("SELECT * FROM jobs", conn)
            conn.close()

            df.to_csv(OUTPUT, index=False)

        except Exception as e:
            logger.exception("CSV export error: %s", e)

        time.sleep(interval)
