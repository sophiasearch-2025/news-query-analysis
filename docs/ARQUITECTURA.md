# Arquitectura del Subsistema de Búsqueda

Este documento describe la estructura técnica del backend encargado de la búsqueda de noticias.

## 1. Arquitectura actual

### Nivel Lógico

El sistema sigue una arquitectura de capas simple:

1.  **Capa de Controlador (Express):** Maneja las rutas HTTP y la validación básica de parámetros (`server.js`).
2.  **Capa de Servicio/Lógica:** Implementada dentro de los controladores, se encarga de:
    * Construir queries básicas para Elasticsearch.
    * Procesar los resultados (parsing de fechas, filtrado de arrays).
    * Formatear la salida.
3.  **Capa de Datos (Elasticsearch Client):** Gestiona la conexión TCP/HTTP con el clúster de Elasticsearch (`db.js`).

### Flujo de Datos

1.  **Entrada:** Solicitud GET con query params (`q`, `country`, `date_from`, etc.).
2.  **Proceso Búsqueda:** El servidor solicita a Elasticsearch documentos que coincidan con el texto (`q`) usando `multi_match`.
3.  **Proceso Filtrado:** El servidor recibe un conjunto de resultados (buffer) y aplica filtros de coincidencia exacta y rango de fechas utilizando algoritmos de JavaScript.
4.  **Salida:** JSON paginado con metadatos.

## 2. Arquitectura final esperada

### Optimización del Motor de Búsqueda
Se espera migrar la lógica de filtrado, que actualmente reside en la capa de aplicación (Node.js), hacia el motor de búsqueda (Elasticsearch) una vez que se mejore la forma en que es creado el índice.

**Cambios planificados:**
* Actualización del mapeo del índice para incluir campos `keyword` y `date` nativos.
* Uso exclusivo de Elastic Query DSL para filtros y ordenamiento (`filter`, `range`, `sort`), eliminando la carga de CPU en el servidor Node.js.
* Implementación de caché (ej. Redis) para consultas frecuentes de filtros (`/api/filters`).
