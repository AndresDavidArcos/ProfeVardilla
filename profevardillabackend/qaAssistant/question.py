
from groq import Groq
import os

def generate_questions(indicador_logro: str, n: int) -> list[str]:
    prompt = (
        f"Genera {n} preguntas académicamente enriquecedoras relacionadas con el siguiente indicador de logro: '{indicador_logro}'. "
        "Las preguntas deben pertenecer a diferentes categorías académicas como: Definición y Conceptos, Comparación y Contraste, Ejemplificación, Listados y Características, Fases y Procesos, Aplicación Práctica, Análisis Crítico, Ventajas y Desventajas, Estudios de Caso, Relación entre Conceptos, y otras relacionadas. "
        "Devuelve las preguntas como una lista separada por comas sin añadir nada mas."
    )
    groq_client = Groq(api_key=os.environ.get('GROQ_API_KEY'))
    response = groq_client.chat.completions.create(
        messages=[{
            'role': 'user',
            'content': prompt
        }],
        model='llama-3.1-8b-instant',
    )

    contenido = response.choices[0].message.content
    print("question.py contenido: ", contenido)
    preguntas = contenido.split(',')
    return [pregunta.strip() for pregunta in preguntas]