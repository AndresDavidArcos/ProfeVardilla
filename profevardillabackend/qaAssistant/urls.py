from django.urls import path
from .views import ask_question, generate_question_view, process_answer_view

urlpatterns = [
    path('ask/', ask_question, name='ask-question'),
    path('question/', generate_question_view, name='generate-question'),
    path('answer/', process_answer_view, name='process-answer'),

]
