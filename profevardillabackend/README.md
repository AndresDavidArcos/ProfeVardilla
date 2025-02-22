Para alimentar al sistema RAG con los datos del curso, se llenara la carpeta "rag_pdf_data" que esta en qaAssistant de archivos pdf con el contenido academico.
Una vez hecho esto, sera posible ejecutar el comando:
```
python manage.py parser
```
El cual convertira estos pdfs en formato markdown que podra ser procesado por el sistema RAG.

El sistema RAG debera consumir estos datos, para hacerlo se ejecuta el comando:
```
python manage.py rag_update_db
```
Que guardara la información consumida en su base de datos en forma de vectores y estara lista para ser consultada desde la api que hara uso del modulo rag_query.py.

Si quiere correr el LLM usando una gpu gratuita puede usar el archivo RunLLmsOnCollab.ipynb en google collab, debera pasarle un authtoken de Ngrok y ejecutarlo, con la url generada en su maquina local debera tener ollama instalado y ejecutar los comandos:
```
set OLLAMA_HOST=<url>
ollama pull llama2
```

Una vez hecho esto, cambiar la url en el archivo qaAssistant\rag_query.py por la generada en el collab. 