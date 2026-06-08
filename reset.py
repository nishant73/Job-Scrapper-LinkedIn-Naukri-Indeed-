import sqlite3
import shutil
import os
from datetime import datetime

def backup_db(db_path):
    if not os.path.exists(db_path):
        print(f"❌ {db_path} not found")
        return

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = f"{db_path}_backup_{timestamp}.db"

    shutil.copy2(db_path, backup_path)
    print(f"✅ Backup created: {backup_path}")


# Backup BOTH databases
backup_db("jobs.db")
backup_db("data/seen_jobs.db")


# Now delete safely
conn = sqlite3.connect("jobs.db")
cursor = conn.cursor()
cursor.execute("DELETE FROM jobs")
conn.commit()
conn.close()

connect = sqlite3.connect("data/seen_jobs.db")
cursor = connect.cursor()
cursor.execute("DELETE FROM seen_jobs")
connect.commit()
connect.close()