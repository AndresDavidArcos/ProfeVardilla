from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from qaAssistant.decorators import firebase_auth_required, firebase_rate_limit
from .rag_query import query_rag  
import traceback
from .question import generate_questions
from .answer import process_answer

@api_view(['POST'])
@firebase_auth_required
@firebase_rate_limit(rate='15/m')
def ask_question(request):
    question = request.data.get('question')
    
    if not question:
        return Response({"error": "La pregunta es requerida."}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        answer, final_documents = query_rag(question)
        return Response({"answer": answer, "documents": final_documents}, status=status.HTTP_200_OK)
    except Exception as e:
        print("ocurrio un error: ", traceback.format_exc())
        return Response({"error": f"Ocurrió un error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@firebase_auth_required
@firebase_rate_limit(rate='15/m')
def generate_question_view(request):
    indicator = request.data.get('indicator')
    questionsPerIndicator = request.data.get('questionsPerIndicator')

    if not indicator:
        return Response({"error": "El indicador es requerido."}, status=status.HTTP_400_BAD_REQUEST)
    if not questionsPerIndicator:
        return Response({"error": "El número de preguntas es requerido."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        questions = generate_questions(indicator, questionsPerIndicator)

        if not questions:
            return Response({"error": "No se pudieron generar preguntas."}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"questions": questions}, status=status.HTTP_200_OK)
    except Exception as e:
        print("Ocurrió un error: ", traceback.format_exc())
        return Response({"error": f"Ocurrió un error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@firebase_auth_required
@firebase_rate_limit(rate='15/m')
def process_answer_view(request):
    question = request.data.get('question')
    student_answer = request.data.get('answer')

    if not question:
        return Response({"error": "La pregunta es requerida."}, status=status.HTTP_400_BAD_REQUEST)
    if not student_answer:
        return Response({"error": "La respuesta del estudiante es requerida."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        pass_status, correction, documents_dict = process_answer(question, student_answer)

        return Response({
            "passStatus": pass_status,
            "correction": correction,
            "documents": documents_dict,
        }, status=status.HTTP_200_OK)
    except Exception as e:
        print("Ocurrió un error: ", traceback.format_exc())
        return Response({"error": f"Ocurrió un error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)