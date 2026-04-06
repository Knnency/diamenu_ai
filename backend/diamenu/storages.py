from django.conf import settings
from django.core.files.storage import FileSystemStorage
from storages.backends.gcloud import GoogleCloudStorage

class MediaStorage(GoogleCloudStorage):
    """
    Standard GCS storage for production.
    In local development (DEBUG=True), DEFAULT_FILE_STORAGE is handled in settings.py.
    """
    location = 'media'
    file_overwrite = False
