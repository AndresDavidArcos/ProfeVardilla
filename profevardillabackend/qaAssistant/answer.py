
from groq import Groq
import os
from .rag_query import query_rag

def process_answer(question: str, studentAnswer: str):
    assistantAnswer, documents_dict = query_rag(question)
    prompt = (
        f"Evalúa la respuesta del estudiante comparándola con la respuesta de referencia. "
        f"Sigue estos pasos:\n"
        f"1. Analiza la PREGUNTA: {question}\n"
        f"2. Compara con la RESPUESTA ESTUDIANTE: {studentAnswer}\n"
        f"3. Considera la RESPUESTA REFERENCIA: {assistantAnswer}\n\n"
        f"Instrucciones de evaluación:\n"
        f"- Determina si la respuesta es correcta (PASA) o incorrecta (REPRUEBA)\n"
        f"- Si es incorrecta: Explica claramente los errores y proporciona la respuesta corregida\n"
        f"- Si es correcta: Complementa la respuesta con información adicional relevante\n"
        f"- Mantén un tono didáctico y constructivo\n"
        f"Formato de respuesta REQUERIDO (en español):\n"
        f"passStatus: [True/False]\n"
        f"correction: [Texto de corrección o complementación]"
    )

    groq_client = Groq(api_key=os.environ.get('GROQ_API_KEY'))
    response = groq_client.chat.completions.create(
        messages=[{
            'role': 'user',
            'content': prompt
        }],
        model='llama-3.1-8b-instant',
    )

    content = response.choices[0].message.content
    passStatus = "passStatus: True" in content
    correction = content.split("correction: ")[1].strip() 

    return passStatus, correction, documents_dict