from django.conf import settings
from django.core.files.storage import FileSystemStorage
from storages.backends.gcloud import GoogleCloudStorage

class MediaStorage(GoogleCloudStorage):
    """
    Custom storage class that uses Google Cloud Storage in production
    and local file system in development.
    """
    def __init__(self, *args, **kwargs):
        if settings.DEBUG:
            self.storage = FileSystemStorage()
        else:
            kwargs['bucket_name'] = settings.GS_BUCKET_NAME
            super().__init__(*args, **kwargs)

    def _save(self, name, content):
        if settings.DEBUG:
            return self.storage._save(name, content)
        return super()._save(name, content)

    def url(self, name):
        if settings.DEBUG:
            return self.storage.url(name)
        return super().url(name)
