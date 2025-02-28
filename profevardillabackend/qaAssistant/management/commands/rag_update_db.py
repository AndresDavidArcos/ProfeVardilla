import json
import unicodedata
import re
import os
from django.core.management.base import BaseCommand
from langchain.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from langchain.document_loaders import PyMuPDFLoader
import chromadb
from chromadb.utils import embedding_functions
from django.conf import settings
import tiktoken

class Command(BaseCommand):
    help = 'Carga archivos y los agrega a Chroma usando el modelo Qwen. Puede usar marker o pymupdf.'

    def add_arguments(self, parser):
        parser.add_argument(
            'method',
            type=str,
            choices=['marker', 'pymupdf'],
            default='pymupdf',
            nargs='?',
            help='Método de carga: marker o pymupdf (por defecto: pymupdf)'
        )

    def handle(self, *args, **options):
        method = options['method']
        MD_FILE_PATH = os.path.join(settings.BASE_DIR, "qaAssistant", "rag_markdown_data", "univalle_desarrolloSoftware_texto.md")
        PDF_DIR_PATH = os.path.join(settings.BASE_DIR, "qaAssistant", "rag_pdf_data")
        CHROMA_PATH = os.path.join(settings.BASE_DIR, "qaAssistant", "rag_chroma")
        DEBUGGINGFILES = os.path.join(settings.BASE_DIR, "qaAssistant", "debuggingfiles")
        CHUNKPERSISTENCE = os.path.join(settings.BASE_DIR, "qaAssistant", "rag_chunks")
        tokenizer = tiktoken.get_encoding("cl100k_base")


        def preprocess_text(text: str) -> str:
            # Convertir a minúsculas
            text = text.lower()
            # Eliminar tildes
            text = ''.join(c for c in unicodedata.normalize('NFD', text) if unicodedata.category(c) != 'Mn')
            text = text.replace('\x00', '')
            # Eliminar caracteres especiales
            chars_to_remove = ["•", "➢", "▪", "●", "◦", "▶", "►", "∗", "‐", "‑", "‒", "–", "—", "✔", "✖", "★", "☆", "→", "⇒", "∴", "∵", "※"]
            for char in chars_to_remove:
                text = text.replace(char, "")
            # Eliminar números aislados en una línea
            text = re.sub(r'^\d+\n', '', text, flags=re.MULTILINE)
            # Eliminar "desarrollo de software i" si está aislado en una línea
            text = re.sub(r'(?m)^desarrollo de software i$', '', text)
            # Espacios en exceso
            text = re.sub(r'\s+', ' ', text).strip()
            return text


        def load_document_marker(file_path: str) -> list[Document]:
            loader = TextLoader(file_path, encoding="utf8")
            return loader.load()

        def load_documents_pymupdf(directory: str) -> list[Document]:
            documents = []
            for filename in os.listdir(directory):
                if filename.endswith(".pdf"):
                    file_path = os.path.join(directory, filename)
                    loader = PyMuPDFLoader(file_path)
                    docs = loader.load()
                    for doc in docs:
                        doc.page_content = preprocess_text(doc.page_content)                    
                    documents.extend(docs)
            return documents

        def token_length(text):
            return len(tokenizer.encode(text))

        def split_documents(documents: list[Document]) -> list[Document]:
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=128,
                chunk_overlap=0,
                length_function=token_length,
                separators=["\n\n", "\n", ".", "?", "!", " ", ""]
            )
            return text_splitter.split_documents(documents)

        def save_chunks_to_file(documents, metadatas, ids, filename: str, debugging: bool = False):
            path = DEBUGGINGFILES if debugging else CHUNKPERSISTENCE
            if debugging:
                with open(os.path.join(path, filename), "w", encoding="utf8") as file:
                    for i, (document, metadata) in enumerate(zip(documents, metadatas), start=1):
                        unique_name = metadata.get("uniqueName", "unknown")
                        local_index = metadata.get("localIndex", "unknown")

                        file.write(f"### Chunk {i} - {unique_name} - localIndex: {local_index}\n\n")
                        file.write(document + "\n\n")
                        file.write("-----\n\n")
            else:
                chunk_data = {
                    "documents": documents,
                    "metadatas": metadatas,
                    "ids": ids
                }
                with open(os.path.join(path, filename), "w", encoding="utf8") as file:
                    json.dump(chunk_data, file, ensure_ascii=False, indent=4)

        def process_chunks(chunks):         
            documents = []
            metadatas = []
            ids = []
            page_counters = {}
            key_counts = {}

            for chunk in chunks:
                source = chunk.metadata['source']
                page = chunk.metadata['page']
                key = f"{source}_{page}"
                key_counts[key] = key_counts.get(key, -1) + 1

            for chunk in chunks:
                source = chunk.metadata['source']
                page = chunk.metadata['page']
                key = f"{source}_{page}"            
                page_counters[key] = page_counters.get(key, -1) + 1            
                current_local = page_counters[key]
                max_local_idx = key_counts[key]
                
                unique_id = f"{key}_{current_local}"
                
                metadata = {
                    "index": len(metadatas),
                    "uniqueName": unique_id,
                    "page": page,
                    "source": source,
                    "localIndex": current_local,
                    "maxLocalIndex": max_local_idx
                }
                
                documents.append(chunk.page_content)
                metadatas.append(metadata)
                ids.append(unique_id)
            
            return documents, metadatas, ids

        def add_to_chroma(chunks: list[Document]):
            client = chromadb.PersistentClient(path=CHROMA_PATH)
            collection_name = "desarrollo_software"
            embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(
                model_name="Alibaba-NLP/gte-Qwen2-1.5B-instruct"
            )

            if collection_name in client.list_collections():
                collection = client.get_collection(collection_name)
            else:
                collection = client.create_collection(
                    name=collection_name,
                    embedding_function=embedding_function,
                    metadata={"hnsw:space": "cosine", "hnsw:search_ef": 100}
                )
            
            documents, metadatas, ids = process_chunks(chunks)

            collection.add(documents=documents, metadatas=metadatas, ids=ids)

            save_chunks_to_file(documents, metadatas, ids, f'chunks_{method}.json', False)
            save_chunks_to_file(documents, metadatas, ids, f'chunks_{method}.md', True)
            self.stdout.write(self.style.SUCCESS(f"{len(chunks)} documentos agregados a Chroma."))

        if method == "marker":
            documents = load_document_marker(MD_FILE_PATH)
        else:  # pymupdf
            documents = load_documents_pymupdf(PDF_DIR_PATH)
        
        chunks = split_documents(documents)
        add_to_chroma(chunks)