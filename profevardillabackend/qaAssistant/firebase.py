from django.conf import settings
import firebase_admin
from firebase_admin import credentials
import os

FIREBASEAPIKEY_PATH = os.path.join(settings.BASE_DIR, "qaAssistant", "firebase_key.json")

cred = credentials.Certificate(FIREBASEAPIKEY_PATH)
firebase_admin.initialize_app(cred)