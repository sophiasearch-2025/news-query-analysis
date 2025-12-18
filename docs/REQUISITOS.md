# Requisitos del Subsistema

## Requisitos Funcionales

1.  **Búsqueda de Texto Completo**
    * **Descripción:** El sistema debe permitir buscar noticias mediante palabras clave que coincidan con el título o el cuerpo de la noticia.
    * **Endpoint:** `GET /api/search?q={termino}`

2.  **Filtrado por Metadatos**
    * **Descripción:** El sistema debe permitir filtrar los resultados por país de origen y medio de comunicación de manera exacta.
    * **Endpoint:** `GET /api/search?country={pais}&media_outlet={medio}`

3.  **Filtrado por Rango de Fechas**
    * **Descripción:** El sistema debe permitir restringir la búsqueda a un periodo de tiempo específico.
    * **Endpoint:** `GET /api/search?date_from={YYYY-MM-DD}&date_to={YYYY-MM-DD}`

4.  **Paginación de Resultados**
    * **Descripción:** El sistema debe entregar los resultados paginados para no saturar la respuesta, permitiendo configurar el número de página y el límite de elementos.

5.  **Obtención de Filtros Disponibles**
    * **Descripción:** El sistema debe proveer una lista de todos los medios y países disponibles en el índice, así como el rango de fechas total, para poblar los selectores de la interfaz de usuario.
    * **Endpoint:** `GET /api/filters`

## Requisitos No Funcionales

1.  **Compatibilidad de Datos**
    * **Descripción:** El sistema debe ser capaz de manejar fechas en formato de texto no estándar (ej. "Mar 05, 2025") sin generar errores en tiempo de ejecución.

2.  **Resiliencia a Fallos de Mapeo**
    * **Descripción:** El sistema debe seguir operando funcionalmente (realizando búsquedas y filtros) incluso si el índice de Elasticsearch no tiene optimizaciones de tipos de datos (como campos `keyword` o `date`).

3.  **Independencia de Entorno**
    * **Descripción:** La aplicación debe ser contenerizable y configurable mediante variables de entorno para facilitar su despliegue en distintos servidores.
