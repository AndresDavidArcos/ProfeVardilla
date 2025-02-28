import os
import json
import chromadb
from chromadb.utils import embedding_functions
from django.core.management.base import BaseCommand
from django.conf import settings

CHROMA_PATH = os.path.join(settings.BASE_DIR, "qaAssistant", "rag_chroma")
DEBUGGINGFILES = os.path.join(settings.BASE_DIR, "qaAssistant", "debuggingfiles")
DEFAULT_QUERY = """
Características de los requerimientos.
Necesario: Lo que pida un requisito debe ser necesario para el producto.
Correcto: sí y solo sí, cada requisito especificado es un requisito que el software debe cumplir.
No ambiguo: El texto debe ser claro, preciso y tener una única interpretación posible.
Conciso: Debe redactarse en un lenguaje comprensible por los clientes en lugar de uno de tipo 
técnico y especializado, aunque aún así debe referenciar los aspectos importantes
Consistente: Ningún requisito debe entrar en conflicto con otro requisito diferente. Asimismo, el 
lenguaje empleado entre los distintos requisitos debe ser consistente también.
Completo: Los requisitos deben contener en sí mismos toda la información necesaria, y no remitir 
a otras fuentes externas que los expliquen con más detalle.
Alcanzable: Un requisito debe ser un objetivo realista, posible de ser alcanzado con el dinero, el 
tiempo y los recursos disponibles.
"""

def save_docs_to_file(docs, metadatas, filename="rag_results.md"):
    path = os.path.join(DEBUGGINGFILES, filename)
    with open(path, "w", encoding="utf8") as file:
        for i, (doc, metadata) in enumerate(zip(docs, metadatas)):
            file.write(f"**Documento {i + 1}:**\n\n")
            file.write(f"{doc.strip()}\n")
            file.write(f"**Metadata:** {json.dumps(metadata, indent=4, ensure_ascii=False)}\n")
            file.write("\n---\n\n")

class Command(BaseCommand):
    help = "Genera contexto a partir de una consulta en ChromaDB."

    def add_arguments(self, parser):
        parser.add_argument("query_text", type=str, nargs="?", default=DEFAULT_QUERY, help="Texto de consulta.")

    def handle(self, *args, **options):
        query_text = options["query_text"]
        client = chromadb.PersistentClient(path=CHROMA_PATH)
        embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="jinaai/jina-embeddings-v2-base-es"
        )
        collection = client.get_collection(name="desarrollo_software", embedding_function=embedding_function)
        
        results = collection.query(query_texts=[query_text], n_results=5)
        documents = results["documents"][0]
        metadatas = results["metadatas"][0]
        
        save_docs_to_file(documents, metadatas)
        self.stdout.write(self.style.SUCCESS("Contexto generado y guardado en rag_results.md"))