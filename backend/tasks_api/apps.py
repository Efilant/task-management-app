from django.apps import AppConfig

class TasksApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'tasks_api'
    verbose_name = 'Tasks API'
    
    def ready(self):
        import tasks_api.signals  # noqa
