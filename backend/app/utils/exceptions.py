class PlanetAPIError(Exception):
    """Base exception for Planet API operations."""
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

class PlanetAuthError(PlanetAPIError):
    """Exception raised for Planet API authentication failures."""
    def __init__(self, message: str = "Planet API authentication failed. Invalid API Key."):
        super().__init__(message=message, status_code=401)

class PlanetNotFoundError(PlanetAPIError):
    """Exception raised when a requested Planet item or resource is not found."""
    def __init__(self, message: str = "Requested satellite scene item not found."):
        super().__init__(message=message, status_code=404)
