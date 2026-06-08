import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
from services.logging_utils import get_logger

# ==============================
# LOAD ENV
# ==============================
load_dotenv()

EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")
TO_EMAIL = os.getenv("TO_EMAIL")
logger = get_logger("notifier")


# ==============================
# BUILD EMAIL
# ==============================
def build_email(job):

    subject = f"🔥 {job.get('job_title')} at {job.get('company_name')} (Score: {job.get('final_score')})"

    body = f"""
Job Title: {job.get('job_title')}
Company: {job.get('company_name')}
Location: {job.get('location')}
GPT Score: {job.get('gpt_score')}
Pre Score: {job.get('pre_score')}
Final Score: {job.get('final_score')}

Apply Link:
{job.get('job_url')}

==============================
JOB DESCRIPTION
==============================
{job.get('job_description')[:1500]}

==============================
COVER LETTER
==============================
{job.get('cover_letter', 'Not generated')}
"""

    msg = MIMEMultipart()
    msg["From"] = EMAIL_USER
    msg["To"] = TO_EMAIL
    msg["Subject"] = subject

    msg.attach(MIMEText(body, "plain"))

    return msg


# ==============================
# SEND EMAIL
# ==============================
def send_email(job):

    try:
        msg = build_email(job)

        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(EMAIL_USER, EMAIL_PASS)
            server.send_message(msg)

        logger.info("Email sent for %s", job.get("job_title"))

    except Exception as e:
        logger.exception("Email failed: %s", e)
