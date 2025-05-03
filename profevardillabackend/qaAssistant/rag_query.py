import os
import unicodedata
from django.conf import settings
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_community.retrievers import BM25Retriever
from langchain.retrievers import  EnsembleRetriever
from langchain.schema import Document
from sentence_transformers import CrossEncoder
from groq import Groq
from together import Together
import time
import re 
from .rag_singleton import rag
import cProfile
import pstats
import logging
from functools import wraps
import time

# Configura logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
logger.addHandler(handler)

def profile(func):
    """Decorador para profiling de funciones"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        profiler = cProfile.Profile()
        profiler.enable()
        start_time = time.time()
        
        try:
            result = func(*args, **kwargs)
        finally:
            profiler.disable()
            elapsed = time.time() - start_time
            
            # Guarda stats en archivo
            stats = pstats.Stats(profiler)
            stats.sort_stats(pstats.SortKey.TIME)
            stats.dump_stats(f"profile_{func.__name__}.prof")
            
            logger.info(f"Función {func.__name__} ejecutada en {elapsed:.2f}s")
            
        return result
    return wrapper

def timeit(func):
    """Decorador para medir tiempo de ejecución"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        elapsed = time.time() - start_time
        logger.info(f"TIMING - {func.__name__}: {elapsed:.4f} segundos")
        return result
    return wrapper
CHROMA_PATH = os.path.join(settings.BASE_DIR, "qaAssistant", "rag_chroma")
CHUNKS_PATH = os.path.join(settings.BASE_DIR, "qaAssistant", "rag_chunks")
DEBUGGINGFILES = os.path.join(settings.BASE_DIR, "qaAssistant", "debuggingfiles")
RETRY_DELAY = 5
USE_TOGETHER = False

if USE_TOGETHER:
    llmClient = Together(api_key=os.environ.get('TOGETHER_API_KEY'))
    model = "AndresCamargo/Qwen2.5-14B-Instruct-DesarrolloSoftware1-Adapter"
else:
    llmClient = Groq(api_key=os.environ.get('GROQ_API_KEY'))
    model = "llama3-70b-8192"
@timeit
@profile
def preprocess_query(query):
    query = query.lower()
    query = ''.join(c for c in unicodedata.normalize('NFD', query) if unicodedata.category(c) != 'Mn')
    query = query.replace('\x00', '')
    query = re.sub(r'[^\w\s]|_', '', query)    
    return query
@timeit
@profile
def rerank_documents(query, documents, top_n=5):
    sentence_pairs = [(query, doc.page_content) for doc in documents]
    scores = rag.reranker.predict(sentence_pairs)    
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
@timeit
@profile
def generate_context(query_text):
    ensemble_results = rag.ensemble.invoke(query_text)    
    reranked_documents = rerank_documents(query_text, ensemble_results, 10)
    final_documents = reconstruct_local_context(reranked_documents, rag.chroma)

    context = "\n\n".join(
    [
        f"### Documento {i+1} ###\n"
        f"{doc.page_content}"
        f"##########################"
        for i, doc in enumerate(final_documents)
    ]
    )
    
    return context, final_documents

def format_alpaca_prompt(instruction):
    return f"""A continuación se presenta una instrucción que describe una tarea. Escribe una respuesta que complete adecuadamente la solicitud.

### Instrucción:
{instruction}

### Respuesta:
"""
@timeit
@profile
def query_rag(query_text):
    query = preprocess_query(query_text)
    context, final_documents = generate_context(query)
    documents_dict = [doc.__dict__ for doc in final_documents]
    PROMPT_TEMPLATE = """Utiliza el siguiente contexto para responder a la pregunta.
         
    CONTEXTO:
    {context}
    
    PREGUNTA:
    {question}
    """
    
    prompt = PROMPT_TEMPLATE.format(
        context=context, 
        question=query,
    )
    system_prompt = (
        "Eres un asistente académico especializado en la asignatura"
        " de Desarrollo de Software en una universidad. "
        "Respondes preguntas con base en material proporcionado por"
        " los profesores, asegurándote de que tus respuestas "
        "sean claras, detalladas, útiles para el aprendizaje y en español."
    )   
    retries = 0
    max_retries = 1
    answer = None
    while True:
        try:
            if USE_TOGETHER:
                full_prompt = format_alpaca_prompt(system_prompt + "\n\n" + prompt)
                response = llmClient.completions.create(
                    model="AndresCamargo/Qwen2.5-14B-Instruct-DesarrolloSoftware1-Adapter",
                    prompt=full_prompt,
                )
                print(response)
                answer = response.choices[0].text
            else:
                response = llmClient.chat.completions.create(
                    messages=[
                        {'role': 'system', 'content': system_prompt},
                        {'role': 'user', 'content': prompt}
                    ],
                    model="llama3-70b-8192",
                )
                answer = response.choices[0].message.content
            break
        except Exception as e:
            retries += 1            
            error_message = str(e)
            print(f"Error al generar expected output: {error_message}")

            if "Limit" in error_message and "TPD" in error_message:
                print("Se alcanzó el límite de tokens por día. Deteniendo el proceso.")
                answer = f"ProfeVardilla esta muy ocupado ahora mismo, intenta mas tarde."
                break

            if retries >= max_retries:
                print("Máximo número de reintentos alcanzado. Abortando.")
                answer = f"ProfeVardilla esta muy ocupado ahora mismo, intenta mas tarde."
                break            

            print(f"Reintentando en {RETRY_DELAY} segundos...")
            time.sleep(RETRY_DELAY)               

    return answer, documents_dict