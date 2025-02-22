from django.core.management.base import BaseCommand
from marker.converters.pdf import PdfConverter
from marker.models import create_model_dict
from marker.output import text_from_rendered
from marker.config.parser import ConfigParser
from django.conf import settings
import os

class Command(BaseCommand):
    help = 'Convierte un archivo PDF a markdown y lo guarda en rag_markdown_data.'

    def handle(self, *args, **options):
        MD_FILE_PATH = os.path.join(settings.BASE_DIR, "qaAssistant", "rag_markdown_data", "univalle_desarrolloSoftware_texto.md")
        RAG_DATASET_PATH = os.path.join(settings.BASE_DIR, "qaAssistant", "rag_pdf_data", "Clase2-DS1-2022-II-NP_compressed.pdf")

        config = {
            "disable_image_extraction": True,
            "languages": "en,es",
            "output_format": "markdown"
        }
        config_parser = ConfigParser(config)

        converter = PdfConverter(
            config=config_parser.generate_config_dict(),
            artifact_dict=create_model_dict(),
            processor_list=config_parser.get_processors(),
            renderer=config_parser.get_renderer()
        )

        rendered = converter(RAG_DATASET_PATH)
        text, metadata, images = text_from_rendered(rendered)

        with open(MD_FILE_PATH, "w", encoding="utf-8") as file:
            file.write(text)

        self.stdout.write(self.style.SUCCESS(f'Texto convertido y guardado en {MD_FILE_PATH}'))