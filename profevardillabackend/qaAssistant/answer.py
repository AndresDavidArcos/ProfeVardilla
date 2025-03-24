
from groq import Groq
import os
from .rag_query import query_rag

def process_answer(question: str, studentAnswer: str):
    assistantAnswer, documents_dict = query_rag(question)
    prompt = (
        f"Evalúa la respuesta de el estudiante comparándola con la respuesta de referencia. "
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
        f"Ejemplo válido:\n"
        f"passStatus: True\n"
        f"correction: Excelente respuesta. Como complemento...\n\n"        
    )

    groq_client = Groq(api_key=os.environ.get('GROQ_API_KEY'))
    response = groq_client.chat.completions.create(
        messages=[{
            'role': 'user',
            'content': prompt
        }],
        model='llama3-70b-8192',
    )

    content = response.choices[0].message.content
    print("\n\nanswer.py contenido: \n\n", content, "\n\nfin de answer.py contenido")
    passStatus = "passStatus: True" in content
    correction = content.split("correction: ")[1].strip() 
    print("\n\nanswer.py passtatus: \n\n", passStatus, "\n\nfin de answer.py passStatus")
    print("\n\nanswer.py correction: \n\n", correction, "\n\nfin de answer.py correction")


    return passStatus, correction, documents_dict