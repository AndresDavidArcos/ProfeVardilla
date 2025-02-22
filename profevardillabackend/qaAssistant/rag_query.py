import chromadb
from chromadb.utils import embedding_functions
from langchain.prompts import ChatPromptTemplate
from langchain.prompts import PromptTemplate
from langchain_community.llms.ollama import Ollama
from django.conf import settings
import os
import requests

CHROMA_PATH = os.path.join(settings.BASE_DIR, "qaAssistant", "rag_chroma")
DEBUGGINGFILES = os.path.join(settings.BASE_DIR, "qaAssistant", "debuggingfiles")

PROMPT_TEMPLATE = """
Utiliza **solamente** el siguiente contexto para responder en español a la pregunta. No añadas información externa.

CONTEXTO:
{context}

PREGUNTA:
{question}
"""

url = "https://6b66-34-75-69-87.ngrok-free.app"

def save_docs_to_file(docs: list[str], filename: str = "documents.md"):    
    with open(os.path.join(DEBUGGINGFILES, filename), "w", encoding="utf8") as file:
        for i, doc in enumerate(docs):
            file.write(f"**Documento {i + 1}:**\n\n")
            file.write(f"{doc.strip()}\n")
            file.write("\n---\n\n")

def query_rag(query_text):
    
    client = chromadb.PersistentClient(path=CHROMA_PATH)
    sentence_transformer_ef = embedding_functions.SentenceTransformerEmbeddingFunction(
         model_name="jinaai/jina-embeddings-v2-base-es"
      )
    
    collection = client.get_collection(name="desarrollo_software", embedding_function=sentence_transformer_ef)
    
    results = collection.query(
        query_texts=[query_text],
        n_results=5,
    )
    
    documents = results["documents"][0]
    save_docs_to_file(documents, filename="rag_results.md")

    context_text = "\n\n---\n\n".join(documents)
    prompt_template = PromptTemplate.from_template(PROMPT_TEMPLATE)
    prompt = prompt_template.format(context=context_text, question=query_text)
    save_docs_to_file([prompt], filename="prompt_result.md")

    data = {
        "model": "llama2",
        "prompt": prompt,
        "stream": False
    }
    response_text = None
    try:
        response = requests.post(url+"/api/generate", json=data, timeout=600)
        response.raise_for_status()
        response_json = response.json()
        response_text = response_json["response"]

    except requests.exceptions.RequestException as e:
        response_text = f"Error al conectar con Ollama: {e}"
        model = Ollama(model="llama2")  
        response_text = model.invoke(prompt)



    return response_text