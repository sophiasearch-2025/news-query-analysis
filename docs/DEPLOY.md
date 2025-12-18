# Despliegue del Subsistema Backend

Este subsistema está diseñado para ser desplegado utilizando contenedores Docker.

## 1. Requisitos

* **Docker Engine:** v20.10 o superior.
* **Docker Compose:** v2.0 o superior.
* **Elasticsearch:** Instancia accesible (local o remota) versión 8.x.

## 2. Instalación y Configuración

1.  **Clonar el repositorio** y acceder al directorio del backend.
2.  **Configurar variables de entorno:** Crear un archivo `.env` o configurar las variables en el sistema.
    * `PORT`: Puerto de escucha (Defecto: 3020).
    * `ELASTIC_NODE`: URL de conexión a Elasticsearch (ej. `http://localhost:9200`).
    * `ELASTIC_INDEX`: Nombre del índice a consultar (Defecto: `noticias`).
3.  **Verificar Dockerfile:** Asegurarse de que el archivo `Dockerfile` y `docker-compose.yml` estén presentes en la raíz.

## 3. Despliegue

### Ejecución con Docker Compose (Recomendado)

Para levantar el servicio de API junto con la configuración de red necesaria:

```bash
docker-compose up --build -d
```

### Ejecución Manual (Node.js)

Si se desea ejecutar sin contenedores para desarrollo:

```bash
npm install
npm start
```

## 4. Pruebas y Verificación

Para verificar que el subsistema se ha desplegado correctamente, se pueden realizar las siguientes pruebas de conectividad:

1.  **Verificar estado del servicio:**
    Comando: `curl http://localhost:3000/api/filters`
    **Resultado esperado:** JSON con `success: true` y listas de medios/países pobladas.

2.  **Prueba de búsqueda:**
    Comando: `curl "http://localhost:3000/api/search?q=chile"`
    **Resultado esperado:** JSON con un array `data` conteniendo noticias relacionadas.
