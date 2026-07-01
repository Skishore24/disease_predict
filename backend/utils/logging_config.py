import logging
import os
from logging.handlers import RotatingFileHandler

def setup_logging():
    log_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "logs")
    try:
        os.makedirs(log_dir, exist_ok=True)
    except PermissionError:
        # Fallback to /tmp on read-only serverless environments like Vercel
        log_dir = os.path.join("/tmp", "logs")
        os.makedirs(log_dir, exist_ok=True)
    log_file = os.path.join(log_dir, "app.log")

    # Set up root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)

    # Prevent duplicating handlers if initialized multiple times
    if root_logger.hasHandlers():
        root_logger.handlers.clear()

    # Formatter
    formatter = logging.Formatter(
        "[%(asctime)s] %(levelname)s [%(name)s:%(lineno)d] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )

    # Console Handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    console_handler.setLevel(logging.INFO)
    root_logger.addHandler(console_handler)

    # File Handler disabled in local development to prevent Live Server infinite reload loops
    # file_handler = RotatingFileHandler(
    #     log_file, maxBytes=10 * 1024 * 1024, backupCount=5, encoding="utf-8"
    # )
    # file_handler.setFormatter(formatter)
    # file_handler.setLevel(logging.INFO)
    # root_logger.addHandler(file_handler)

    logging.info("System logger initialized successfully. Logs written to %s", log_file)
