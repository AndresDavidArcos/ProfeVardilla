import os
from django.core.management.base import BaseCommand
import chromadb
from django.conf import settings

class Command(BaseCommand):
    help = 'Elimina la colección "desarrollo_software" de ChromaDB.'

    def handle(self, *args, **options):
        CHROMA_PATH = os.path.join(settings.BASE_DIR, "qaAssistant", "rag_chroma")
        client = chromadb.PersistentClient(path=CHROMA_PATH)
        collection_name = "desarrollo_software"

        if collection_name in client.list_collections():
            client.delete_collection(collection_name)
            self.stdout.write(self.style.SUCCESS(f'Colección "{collection_name}" eliminada correctamente.'))
        else:
            self.stdout.write(self.style.WARNING(f'La colección "{collection_name}" no existe en ChromaDB.'))