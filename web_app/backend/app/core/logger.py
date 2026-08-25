import logging
import sys
from typing import Optional

def setup_logger(name: Optional[str] = "sam3_api", log_level: int = logging.INFO) -> logging.Logger:
    """
    Configures and returns a production-grade structured logger.
    
    Format: [YYYY-MM-DD HH:MM:SS] [LEVEL] [module]: message
    """
    logger = logging.getLogger(name)
    
    if not logger.handlers:
        logger.setLevel(log_level)
        
        formatter = logging.Formatter(
            fmt="%(asctime)s [%(levelname)s] [%(name)s]: %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(log_level)
        console_handler.setFormatter(formatter)
        
        logger.addHandler(console_handler)
        logger.propagate = False
        
    return logger

# Pre-configured core logger instances
logger = setup_logger("sam3.server")
model_logger = setup_logger("sam3.model")
api_logger = setup_logger("sam3.api")
