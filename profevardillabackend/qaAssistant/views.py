from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .rag_query import query_rag  

@api_view(['POST'])
def ask_question(request):
    question = request.data.get('question')
    
    if not question:
        return Response({"error": "La pregunta es requerida."}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        response_text = query_rag(question)
        return Response({"answer": response_text}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": f"Ocurrió un error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
