import logging
from logging.handlers import RotatingFileHandler
from config import APP_CONFIG


LOG_PATH = APP_CONFIG["files"]["log_file"]
LOG_FORMAT = "%(asctime)s | %(levelname)s | %(name)s | %(message)s"


def configure_logging(level=logging.INFO):
    if getattr(configure_logging, "_configured", False):
        return

    formatter = logging.Formatter(LOG_FORMAT)
    root_logger = logging.getLogger()
    root_logger.setLevel(level)
    root_logger.handlers.clear()

    file_handler = RotatingFileHandler(
        LOG_PATH,
        maxBytes=2 * 1024 * 1024,
        backupCount=3,
    )
    file_handler.setLevel(level)
    file_handler.setFormatter(formatter)
    root_logger.addHandler(file_handler)

    console_handler = logging.StreamHandler()
    console_handler.setLevel(level)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)

    configure_logging._configured = True


def get_logger(name):
    configure_logging()
    return logging.getLogger(name)


def format_duration(seconds):
    if seconds < 60:
        return f"{seconds:.2f}s"
    return f"{seconds / 60:.2f}m"


def log_iteration_summary(logger, scraper_name, iteration_label, jobs_found, fresh_jobs, duration_seconds):
    logger.info(
        "%s iteration complete | %s | jobs_found=%s | fresh_jobs=%s | duration=%s",
        scraper_name,
        iteration_label,
        jobs_found,
        fresh_jobs,
        format_duration(duration_seconds),
    )


def log_cycle_summary(logger, scraper_name, jobs_found, fresh_jobs, duration_seconds):
    logger.info(
        "%s cycle complete | jobs_found=%s | fresh_jobs=%s | duration=%s",
        scraper_name,
        jobs_found,
        fresh_jobs,
        format_duration(duration_seconds),
    )
