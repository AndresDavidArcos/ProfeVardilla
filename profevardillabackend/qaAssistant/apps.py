from django.apps import AppConfig

class QaassistantConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'qaAssistant'
    def ready(self):
        from . import firebase