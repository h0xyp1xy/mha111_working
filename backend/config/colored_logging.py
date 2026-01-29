"""
Colored logging configuration for Django.
Provides colored console output for better visibility.
"""
import logging
import sys

try:
    from colorlog import ColoredFormatter
    COLORLOG_AVAILABLE = True
except ImportError:
    COLORLOG_AVAILABLE = False


def get_colored_handler():
    """Get a colored console handler"""
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(logging.DEBUG)
    
    if COLORLOG_AVAILABLE:
        # Use colorlog for colored output
        formatter = ColoredFormatter(
            '%(log_color)s%(levelname)-8s%(reset)s %(blue)s%(asctime)s%(reset)s '
            '%(cyan)s[%(name)s]%(reset)s %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S',
            reset=True,
            log_colors={
                'DEBUG': 'cyan',
                'INFO': 'green',
                'WARNING': 'yellow',
                'ERROR': 'red',
                'CRITICAL': 'red,bg_white',
            },
            secondary_log_colors={},
            style='%'
        )
    else:
        # Fallback to simple formatter
        formatter = logging.Formatter(
            '%(levelname)-8s %(asctime)s [%(name)s] %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
    
    handler.setFormatter(formatter)
    return handler


def setup_colored_logging():
    """Setup colored logging for the application"""
    root_logger = logging.getLogger()
    
    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Add colored handler
    handler = get_colored_handler()
    root_logger.addHandler(handler)
    root_logger.setLevel(logging.INFO)
    
    # Set levels for specific loggers
    logging.getLogger('django').setLevel(logging.INFO)
    logging.getLogger('django.server').setLevel(logging.WARNING)
    logging.getLogger('api').setLevel(logging.INFO)
    
    return root_logger


