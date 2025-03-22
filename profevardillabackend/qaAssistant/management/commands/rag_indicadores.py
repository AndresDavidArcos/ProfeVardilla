from django.core.management.base import BaseCommand
from django.conf import settings
import os
import chromadb
from groq import Groq
from chromadb.utils import embedding_functions


class Command(BaseCommand):
    help = 'Asigna indicadores de logro relevantes a documentos en ChromaDB utilizando Groq.'

    def handle(self, *args, **options):
        # Configuración de ChromaDB
        CHROMA_PATH = os.path.join(settings.BASE_DIR, 'qaAssistant', 'rag_chroma')

        # Inicializar ChromaDB
        client = chromadb.PersistentClient(path=CHROMA_PATH)
        embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="Alibaba-NLP/gte-Qwen2-1.5B-instruct"
        )
        collection = client.get_collection(name='desarrollo_software', embedding_function=embedding_function)

        # Inicializar Groq
        groq_client = Groq(api_key=os.environ.get('GROQ_API_KEY'))

        # Lista de indicadores de logro
        indicadores_logro = {
            "IL 1.1": "Comprende los conceptos de ingeniería de software y ciclo de vida del software en forma coherente",
            "IL 1.2": "Comprende los conceptos de las metodologías de desarrollo de software en forma diferenciada",
            "IL 1.3": "Reconoce los conceptos que caracterizan las metodologías ágiles, tradicionales y otras tecnologías usadas en App de desarrollo de software para identificar ventajas y desventajas de este tipo de metodologías",
            "IL 1.4": "Comprende de forma clara la idea de un proyecto de software para poder realizar su especificación",
            "IL 1.5": "Calcula fechas para un proyecto de desarrollo de software para identificar fechas críticas",
            "IL 1.6": "Reconoce los roles de puede desempeñar dentro de un equipo de desarrollo de software para formar un equipo de desarrollo de software",
            "IL 1.7": "Identifica las tecnologías de desarrollo de software (protocolos, lenguajes, APIs, BDatos y aplicaciones) para aplicarlas a un proyecto de desarrollo de software",
            "IL 1.8": "Usa las prácticas ágiles para crear una visión de la arquitectura de un sistema de software",
            "IL 1.9": "Usa las Historias de Usuario (HU) para identificar los objetivos o funcionalidades de un sistema de software",
            "IL 1.10": "Usa las prácticas ágiles para priorizar y estimar las HU con el propósito de crear el product backlog",
            "IL 2.1": "Produce un release plan y una estimación de tiempo y costos para un producto de software a partir del product backlog para definir un plan de trabajo",
            "IL 2.2": "Usa las HU y conceptos de tipos App para entender y definir sus detalles mediante descripciones o modelos",
            "IL 2.3": "Especifica la forma de realizar la gestión de la configuración del desarrollo del sistema para realizar el seguimiento de las fases del desarrollo de software y sus cambios",
            "IL 2.4": "Define componentes (Librerías de Javascript, CSS3, HTML5, Plantillas, APIS, Frameworks, Bases de datos, etc) para ser usados en el proceso de desarrollo",
            "IL 2.5": "Usa diferentes lenguajes de programación para implementar el Front-end y Back-end de una aplicación de software",
            "IL 2.6": "Usa diferentes tecnologías, estándares de codificación y validación estática del código para el desarrollo del software",
            "IL 2.7": "Usa un repositorio distribuido para el versionamiento del código desarrollado",
            "IL 2.8": "Usa técnicas de pruebas (Unitarias y de aceptación) para validar el código implementado",
            "IL 2.9": "Define la arquitectura de la infraestructura tecnológica adecuada, pruebas y herramientas para un proyecto de desarrollo de software",
            "IL 2.10": "Usa la arquitectura tecnológica definida para desplegar el sistema de software localmente y en la nube"
        }


        # Obtener todos los documentos de la colección
        documents = collection.get()

        # Filtrar documentos sin el metadata "indicadores_logro"
        ids_to_update = []
        metadatas_to_update = []
        indicadores_logro_str = '\n'.join([f'{key}: {value}' for key, value in indicadores_logro.items()])

        for doc in documents['documents']:
            metadata = doc['metadata']

            if 'indicadores_logro' not in metadata:
                response = groq_client.chat.completions.create(
                    messages=[{
                        'role': 'user',
                        'content': (
                            f'Dado el siguiente contenido de un documento:\n\n{doc_content}\n\n'
                            f'Selecciona los indicadores de logro que se relacionan con este contenido. '
                            f'Los indicadores son:\n\n{indicadores_logro_str}\n\n'
                            'Responde únicamente con una lista de IDs separados por comas, sin agregar ninguna explicación.'
                        )
                    }],
                    model='llama-3.1-8b-instant',
                )

                indicadores_relevantes = [i.strip() for i in response.choices[0].message.content.split(",")] if response.choices else []

                if indicadores_relevantes:
                    ids_to_update.append(doc['id'])
                    metadatas_to_update.append({'indicadores_logro': indicadores_relevantes})

        # Actualizar los documentos en ChromaDB
        if ids_to_update:
            collection.update(ids=ids_to_update, metadatas=metadatas_to_update)
            self.stdout.write(self.style.SUCCESS(f'Actualizados {len(ids_to_update)} documentos con indicadores de logro.'))
        else:
            self.stdout.write(self.style.WARNING('No hay documentos que necesiten actualización.'))
