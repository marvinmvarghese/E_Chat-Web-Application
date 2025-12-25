class AppState:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AppState, cls).__new__(cls)
            cls._instance.token = None
            cls._instance.user_id = None
            cls._instance.email = None
            cls._instance.api_url = "http://localhost:8000"
            cls._instance.ws_url = "ws://localhost:8000"
        return cls._instance

state = AppState()
