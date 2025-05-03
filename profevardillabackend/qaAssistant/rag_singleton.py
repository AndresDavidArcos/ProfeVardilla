import os
from django.conf import settings
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_community.retrievers import BM25Retriever
from langchain.retrievers import EnsembleRetriever
from langchain.schema import Document
from sentence_transformers import CrossEncoder

class RagSingleton:
    _instance = None
    _initialized = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        if not self._initialized:
            #Alibaba-NLP/gte-Qwen2-1.5B-instruct
            self.embedding = HuggingFaceEmbeddings(
                model_name="intfloat/multilingual-e5-small"
            )                 

            self.chroma = Chroma(
                persist_directory=os.path.join(settings.BASE_DIR, "qaAssistant", "rag_chroma"),
                collection_name="desarrollo_software",
                embedding_function=self.embedding
            )
            
            retrieved_data = self.chroma._collection.get()
            self.documents = [
                Document(page_content=doc, metadata=meta) 
                for doc, meta in zip(retrieved_data['documents'], retrieved_data['metadatas'])
            ]

            self._has_documents = len(self.documents) > 0

            if self._has_documents:          
                self.bm25 = BM25Retriever.from_documents(self.documents)
                self.bm25.k = 10
                
                self.ensemble = EnsembleRetriever(
                    retrievers=[
                        self.chroma.as_retriever(search_kwargs={"k": 10}),
                        self.bm25
                    ],
                    weights=[0.3, 1]
                )
                
                self.reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-12-v2", max_length=512)

                self._initialized = True
            else:
                print("No se pudo inicializar el RAG debido a que la base vectorial esta vacía.")

rag = RagSingleton()