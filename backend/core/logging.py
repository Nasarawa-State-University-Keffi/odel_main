"""
Logging configuration for the ODeL application.
Provides centralized logging with database-driven control.
"""
import logging
from core.utils import get_setting


def get_logger(name):
    """
    Get a logger instance with dynamic logging level control.
    
    Args:
        name (str): Logger name (usually __name__)
    
    Returns:
        logging.Logger: Configured logger instance
    
    Example:
        >>> from core.logging import get_logger
        >>> logger = get_logger(__name__)
        >>> logger.info("Application started")
    """
    logger = logging.getLogger(name)
    
    # Set logging level based on database setting
    # Only query this once per logger instance
    if not logger.handlers:
        setup_logger_level(logger)
    
    return logger


def setup_logger_level(logger):
    """Set the logging level based on database settings"""
    try:
        # Get logging enabled setting
        logging_enabled = get_setting('ENABLE_APPLICATION_LOGGING', default=True)
        
        if not logging_enabled:
            logger.setLevel(logging.CRITICAL + 1)  # Effectively disable
            return
        
        # Get log level from settings
        log_level_str = get_setting('LOG_LEVEL', default='INFO')
        log_level = getattr(logging, log_level_str.upper(), logging.INFO)
        logger.setLevel(log_level)
        
    except Exception:
        # Fallback to INFO if settings not available
        logger.setLevel(logging.INFO)


def is_logging_enabled():
    """Check if application logging is enabled"""
    try:
        return get_setting('ENABLE_APPLICATION_LOGGING', default=True)
    except Exception:
        return True


class LoggerMixin:
    """
    Mixin to add logging capabilities to any class.
    
    Usage:
        class MyView(LoggerMixin, APIView):
            def get(self, request):
                self.logger.info("Processing GET request")
    """
    @property
    def logger(self):
        if not hasattr(self, '_logger'):
            name = f"{self.__class__.__module__}.{self.__class__.__name__}"
            self._logger = get_logger(name)
        return self._logger
