
from groq import Groq
import os

def generate_questions(indicador_logro: str, n: int) -> list[str]:
    print("\n\nn: ", n,"\n")
    pregunta_palabra = "pregunta académica" if n == 1 else f"{n} preguntas académicas"

    prompt = (
        f"Genera exactamente {n} preguntas academicas sobre: '{indicador_logro}'\n"
        "Requisitos estrictos:\n"
        "1. Preguntas variadas cubriendo diferentes enfoques (definiciones, comparaciones, ejemplos, procesos, caracteristicas, analisis, etc...)\n"
        "2. Cada pregunta debe iniciar con <soquestion> y terminar con <eoquestion>\n"
        "3. Solo incluir las preguntas, sin comentarios, numeración o categorías\n"
        "\nEjemplo de formato válido para 1 pregunta:\n"
        "<soquestion> texto 1<eoquestion>\n"
        "\nEjemplo de formato válido para 2 preguntas:\n"
        "<soquestion> texto 1<eoquestion>\n"
        "<soquestion> texto 2<eoquestion>\n"
    )    
    groq_client = Groq(api_key=os.environ.get('GROQ_API_KEY'))
    response = groq_client.chat.completions.create(
        messages=[{
            'role': 'user',
            'content': prompt
        }],
        model='llama3-70b-8192',
    )

    contenido = response.choices[0].message.content
    print("\n\nquestion.py contenido: \n\n", contenido, "\n\nfin de question.py contenido")
    preguntas = []
    for bloque in contenido.split('<soquestion>'):
        if '<eoquestion>' in bloque:
            pregunta = bloque.split('<eoquestion>')[0].strip()
            if pregunta:  
                preguntas.append(pregunta)

    print(f"\nPreguntas generadas ({len(preguntas)}):")
    for i, p in enumerate(preguntas, 1):
        print(f"{i}. {p}")

    return preguntas