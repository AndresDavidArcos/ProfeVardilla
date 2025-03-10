import os
import requests
import unicodedata
import json
from django.conf import settings
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_community.retrievers import BM25Retriever
from langchain.retrievers import  EnsembleRetriever
from langchain.schema import Document
from sentence_transformers import CrossEncoder

CHROMA_PATH = os.path.join(settings.BASE_DIR, "qaAssistant", "rag_chroma")
CHUNKS_PATH = os.path.join(settings.BASE_DIR, "qaAssistant", "rag_chunks")
DEBUGGINGFILES = os.path.join(settings.BASE_DIR, "qaAssistant", "debuggingfiles")

PROMPT_TEMPLATE = """
Utiliza **solamente** el siguiente contexto para responder en español a la pregunta. No añadas información externa.

CONTEXTO:
{context}

PREGUNTA:
{question}
"""

def preprocess_query(query):
    query = query.lower()
    query = ''.join(c for c in unicodedata.normalize('NFD', query) if unicodedata.category(c) != 'Mn')
    query = query.replace('\x00', '')
    return query

def save_docs_to_file(docs: list[str], filename: str = "documents.md"):    
    with open(os.path.join(DEBUGGINGFILES, filename), "w", encoding="utf8") as file:
        for i, doc in enumerate(docs):
            file.write(f"**Documento {i + 1}:**\n\n")
            file.write(f"{doc.strip()}\n")
            file.write("\n---\n\n")

def load_bm25_corpus(file_path: str) -> list[Document]:
    with open(file_path, "r", encoding="utf8") as f:
        data = json.load(f)
    return [Document(page_content=doc, metadata=meta) for doc, meta in zip(data["documents"], data["metadatas"])]

def rerank_documents(query, documents, model_name='cross-encoder/ms-marco-MiniLM-L-12-v2', top_n=5):
    model = CrossEncoder(model_name, max_length=512)
    sentence_pairs = [(query, doc.page_content) for doc in documents]
    scores = model.predict(sentence_pairs)    
    ranked_docs = sorted(zip(documents, scores), key=lambda x: x[1], reverse=True)
    return [doc for doc, score in ranked_docs[:top_n]] 

def reconstruct_local_context(reranked_documents, chroma_collection):
    source_page_groups = {}
    
    for doc in reranked_documents:
        metadata = doc.metadata
        source = metadata['source']
        page = metadata['page']
        local_index = metadata['localIndex']
        max_local_index = metadata['maxLocalIndex']
        source_page_key = f"{source}_{page}"

        if source_page_key not in source_page_groups:
            source_page_groups[source_page_key] = {
                "maxLocalIndex": max_local_index,
                "retrieved_chunks": set()
            }
        
        source_page_groups[source_page_key]["retrieved_chunks"].add(local_index)
        if max_local_index > 0:
            source_page_groups[source_page_key]["retrieved_chunks"].update(range(max_local_index + 1))

    chunk_ids_to_fetch = [f"{source}_{page}_{idx}" for source_page_key, info in source_page_groups.items() 
                          for source, page in [source_page_key.rsplit("_", 1)] 
                          for idx in info["retrieved_chunks"]]
    
    retrieved_chunks = chroma_collection.get(ids=chunk_ids_to_fetch)
    grouped_chunks = {}
    
    for chunk, metadata in zip(retrieved_chunks['documents'], retrieved_chunks['metadatas']):
        source_page_key = f"{metadata['source']}_{metadata['page']}"
        if source_page_key not in grouped_chunks:
            grouped_chunks[source_page_key] = {"page_content": [], "metadata": metadata}
        grouped_chunks[source_page_key]["page_content"].append(chunk)
    
    source_page_documents = {}
    for source_page_key, data in grouped_chunks.items():
        merged_content = " ".join(data["page_content"])
        source_page_documents[source_page_key] = Document(page_content=merged_content, metadata=data["metadata"])

    final_documents = []
    for doc in reranked_documents:
        source_page_key = f"{doc.metadata['source']}_{doc.metadata['page']}"
        if source_page_key in source_page_documents:
            final_documents.append(source_page_documents[source_page_key])
    
    return final_documents

def generate_context(query_text):
    embeddingFunction = HuggingFaceEmbeddings(
        model_name="Alibaba-NLP/gte-Qwen2-1.5B-instruct"
    )
    dense_vectorstore = Chroma(
        persist_directory=CHROMA_PATH,
        collection_name="desarrollo_software", 
        embedding_function=embeddingFunction
    )
    dense_retriever = dense_vectorstore.as_retriever(search_kwargs={"k": 10})
    
    bm25_corpus_file = os.path.join(CHUNKS_PATH, "chunks_pymupdf.json")
    bm25_docs = load_bm25_corpus(bm25_corpus_file)
    bm25_retriever = BM25Retriever.from_documents(bm25_docs)
    bm25_retriever.k = 10
    
    ensemble_retriever = EnsembleRetriever(
        retrievers=[dense_retriever, bm25_retriever],
        weights=[0.3, 1]
    )
    
    ensemble_results = ensemble_retriever.invoke(query_text)
    reranked_documents = rerank_documents(query_text, ensemble_results, "cross-encoder/ms-marco-MiniLM-L-12-v2", 10)
    print("reranked_documents: ", reranked_documents, "\n---"*10)
    final_documents = reconstruct_local_context(reranked_documents, dense_vectorstore)
    print("final_documents: ", final_documents, "\n---"*10)

    context = "\n\n".join(
    [
        f"### Documento {i+1} ###\n"
        f"{doc.page_content}"
        f"##########################"
        for i, doc in enumerate(final_documents)
    ]
    )
    
    save_docs_to_file([context], filename="rag_results.md")
    return context, final_documents

def query_rag(query_text):
    context, final_documents = generate_context(query_text)
    documents_dict = [doc.__dict__ for doc in final_documents]
    print("documents_dict: ", documents_dict, "\n---"*10)    
    PROMPT_TEMPLATE = """Utiliza el siguiente contexto para responder a la pregunta.
         
    CONTEXTO:
    {context}
    
    PREGUNTA:
    {question}
    """
    
    prompt = PROMPT_TEMPLATE.format(
        context=context, 
        question=query_text,
    )
    
    url = "https://api.awanllm.com/v1/chat/completions"
    headers = {
        'Content-Type': 'application/json',
        'Authorization': "Bearer "
    }
    
    data = {
        "model": "Meta-Llama-3.1-8B-Instruct",  
        "messages": [
            {"role": "system", "content": "Eres un asistente académico especializado en la asignatura de Desarrollo de Software en una universidad. Respondes preguntas con base en material proporcionado por los profesores, asegurándote de que tus respuestas sean claras, detalladas, útiles para el aprendizaje y en español."},
            {"role": "user", "content": prompt}
        ],
        "repetition_penalty": 1.1,
        "temperature": 0.7,
        "top_p": 0.9,
        "top_k": 40,
        "max_tokens": 10000,
        "stream": False
    }
    try:
        response = requests.post(url, headers=headers, json=data, timeout=600)
        response.raise_for_status()
        response_json = response.json()
        
        if "choices" in response_json and len(response_json["choices"]) > 0:
            answer = response_json["choices"][0]["message"]["content"]  
        else:
            answer = "No se obtuvo respuesta válida."
    except requests.exceptions.RequestException as e:
        answer = f"Error al conectar con AwanLLM: {e}"

    return answer, documents_dict