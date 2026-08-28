from typing import Optional, Dict, Any

class AppException(Exception):
    """Base application exception with error code and status code."""
    def __init__(
        self,
        message: str,
        status_code: int = 500,
        error_code: str = "INTERNAL_ERROR",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details or {}

class NotFoundError(AppException):
    def __init__(self, message: str = "Resource not found", details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, status_code=404, error_code="NOT_FOUND", details=details)

class ValidationError(AppException):
    def __init__(self, message: str = "Invalid request parameter", details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, status_code=400, error_code="VALIDATION_ERROR", details=details)

class AuthenticationError(AppException):
    def __init__(self, message: str = "Authentication required or credentials invalid", details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, status_code=401, error_code="AUTHENTICATION_ERROR", details=details)

class AuthorizationError(AppException):
    def __init__(self, message: str = "Insufficient permissions to perform this action", details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, status_code=403, error_code="FORBIDDEN", details=details)

class ModelInferenceError(AppException):
    def __init__(self, message: str = "Model execution failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, status_code=500, error_code="MODEL_INFERENCE_ERROR", details=details)

class StorageError(AppException):
    def __init__(self, message: str = "Storage operation failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, status_code=500, error_code="STORAGE_ERROR", details=details)
