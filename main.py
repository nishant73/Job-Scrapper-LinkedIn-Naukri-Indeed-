from threading import Thread
import threading
import time
from services.ranker import init
from scrapers.linkedIn import linkedIn
from scrapers.naukri import Naukri   # optional
from scrapers.indeed import Indeed
from services.storage import init_db
from services.logging_utils import configure_logging, get_logger
from pipeline.processor import processor
from csv_exporter import export_loop
import os
import sys
LOCK_FILE = "app.lock"
logger = get_logger("main")

def acquire_lock():
    if os.path.exists(LOCK_FILE):
        logger.warning("Another instance is already running. Exiting.")
        sys.exit(0)

    with open(LOCK_FILE, "w") as f:
        f.write(str(os.getpid()))

def release_lock():
    if os.path.exists(LOCK_FILE):
        os.remove(LOCK_FILE)

def start_system():
    configure_logging()
    logger.info("Starting job automation system.")
    # ---- Initialize Database ----
    init_db()
    init()
    # ---- Start Processor (Consumer) ----
    processor_thread = Thread(
        target=processor,
        daemon=True
    )
    processor_thread.start()
    logger.info("Processor started.")

    # ---- Start LinkedIn Scraper ----
    linkedin_thread = threading.Thread(target=linkedIn, daemon=True)
    linkedin_thread.start()
    logger.info("LinkedIn scraper started.")

    # ---- Start CSV Exporter ----
    csv_thread = threading.Thread(target=export_loop, daemon=True)
    csv_thread.start()
    logger.info("CSV exporter started.")

    naukri_thread = Thread(
        target=Naukri,
        daemon=True
    )
    naukri_thread.start()
    logger.info("Naukri scraper started.")

    indeed_thread = Thread(
        target=Indeed,
        daemon=True
    )
    indeed_thread.start()
    logger.info("Indeed scraper started.")

    # ---- Keep Main Alive ----
    try:
        while True:
            time.sleep(1)

    except KeyboardInterrupt:
        logger.info("Shutting down system.")

if __name__ == "__main__":
    acquire_lock()

    try:
        start_system()
    finally:
        release_lock()
