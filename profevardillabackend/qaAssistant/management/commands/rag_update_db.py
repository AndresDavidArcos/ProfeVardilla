import json
from django.core.management.base import BaseCommand
from langchain.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
import chromadb
from chromadb.utils import embedding_functions
from django.conf import settings
import os

class Command(BaseCommand):
    help = 'Carga un archivo Markdown, lo divide en chunks y lo agrega a Chroma usando el modelo nomic-embed-text.'

    def handle(self, *args, **options):
        MD_FILE_PATH = os.path.join(settings.BASE_DIR, "qaAssistant", "rag_markdown_data", "univalle_desarrolloSoftware_texto.md")
        CHROMA_PATH = os.path.join(settings.BASE_DIR, "qaAssistant", "rag_chroma")
        DEBUGGINGFILES = os.path.join(settings.BASE_DIR, "qaAssistant", "debuggingfiles")
        CHUNKPERSISTENCE = os.path.join(settings.BASE_DIR, "qaAssistant", "rag_chunks")

        def load_document(file_path: str) -> list[Document]:
            loader = TextLoader(file_path, encoding="utf8")
            documents = loader.load()
            return documents

        documents = load_document(MD_FILE_PATH)
        
        def split_documents(documents: list[Document]) -> list[Document]:
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=300,
                length_function=len,
                is_separator_regex=False,
            )
            chunks = text_splitter.split_documents(documents)
            self.stdout.write(f"Documento dividido en {len(chunks)} chunks.")
            return chunks
        
        def save_chunks_to_file(chunks: list, filename: str = "chunks.json", Debugging: bool = False):
            if Debugging:
                with open(os.path.join(DEBUGGINGFILES, filename), "w", encoding="utf8") as file:
                    for i, chunk in enumerate(chunks, start=1):
                        file.write(f"### Chunk {i}\n\n")
                        file.write(chunk.page_content + "\n\n")
                        file.write("-----\n\n")
                print(f"Chunks guardados en modo Debugging en {os.path.join(DEBUGGINGFILES, filename)}")
            else:
                chunk_data = {
                    "ids": [f"doc_{i}" for i in range(len(chunks))],
                    "documents": [chunk.page_content for chunk in chunks]
                }   
                with open(os.path.join(CHUNKPERSISTENCE, filename), "w", encoding="utf8") as file:
                    json.dump(chunk_data, file, ensure_ascii=False, indent=4)
                print(f"Chunks guardados en modo Persistencia en {os.path.join(CHUNKPERSISTENCE, filename)}") 

        chunks = split_documents(documents)
        save_chunks_to_file(chunks, 'chunks_RecursiveCharacterTextSplitter.md', True)
        save_chunks_to_file(chunks, 'chunks.json', False)

        def add_to_chroma(chunks: list[Document]):        
            client = chromadb.PersistentClient(path=CHROMA_PATH)

            collection_name = "desarrollo_software"
            sentence_transformer_ef = embedding_functions.SentenceTransformerEmbeddingFunction(
                model_name="jinaai/jina-embeddings-v2-base-es"
            )
            if collection_name in client.list_collections():
                client.delete_collection(collection_name)

            collection = client.create_collection(
                name= collection_name, 
                embedding_function=sentence_transformer_ef,
                metadata={
                    "hnsw:space": "cosine",
                    "hnsw:search_ef": 100
                }
            )
            
            self.stdout.write(f"Agregando {len(chunks)} documentos a la colección '{collection_name}'...")
            
            # Agregar documentos a la colección
            for i, chunk in enumerate(chunks):
                collection.add(
                    ids=[f"doc_{i}"],
                    documents=[chunk.page_content],
                )

            self.stdout.write(self.style.SUCCESS(f"{len(chunks)} documentos agregados a Chroma y base de datos actualizada."))

        add_to_chroma(chunks)
