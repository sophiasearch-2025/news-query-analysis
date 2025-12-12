# API de Búsqueda de Noticias

Sistema de búsqueda y filtrado de noticias de alto rendimiento, conectado a un clúster de Elasticsearch. Incluye un backend (API RESTful) con Node.js y un frontend (cliente) con React.

## Esquema del Índice (Elasticsearch)

Esta API está diseñada para interactuar con un índice de Elasticsearch. El esquema es flexible, pero se asume una estructura con campos clave indexados:

* **Índice:** `noticias` (nombre por defecto, configurable vía `.env`)
* **Campos Clave (`_source`):**
    * `id_noticia` (Keyword): Identificador único.
    * `titulo` (Text): Título de la noticia (usado para `multi_match`).
    * `texto_noticia` (Text): Contenido de la noticia (usado para `multi_match`).
    * `fecha_subida` (Date): Fecha de publicación (para filtros de rango y ordenamiento).
    * `url` (Keyword): Enlace a la noticia original.
    * `medio.nombre` (Text/Keyword): Nombre de la fuente (usado para `multi_match`).
    * `medio.pais` (Text/Keyword): País de la fuente (usado para filtro de país).

---

## Tecnologías

* **Backend:** Node.js, Express, **`@elastic/elasticsearch`**
* **Frontend:** React (Vite), Tailwind CSS
* **Base de Datos/Motor de Búsqueda:** **Elasticsearch**

---

## Configuración y Puesta en Marcha

Sigue estos pasos para levantar el entorno completo (Backend + Frontend).

### Backend (API con Elasticsearch)

1.  Navega a la carpeta `backend/`.
2.  Crea un archivo `.env` en la raíz de `/backend`. Este archivo **es fundamental** y debe contener la URL de tu clúster de Elasticsearch:
    ```ini
    # backend/.env
    # URL del nodo de Elasticsearch (por defecto es 9200)
    ELASTIC_NODE=http://localhost:9200
    # Nombre del índice donde se buscarán los datos (por defecto: noticias)
    ELASTIC_INDEX=noticias 
    ```
    > **Nota:** El módulo `db.js` verifica la conexión al iniciar. Si no hay conexión o el índice no existe, la API te lo indicará.

3.  Instala las dependencias y corre el servidor (por defecto en `http://localhost:3000`):
    ```bash
    cd backend
    npm install
    npm run dev
    ```


### Frontend (Cliente Web)

1.  Abre una **terminal separada**.
2.  Navega a la carpeta `frontend/`.
3.  Instala las dependencias y corre el cliente (por defecto en `http://localhost:5173`):
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

## Funciones

* **Conexión a Elasticsearch:** Gestionada por el cliente `Client` de `@elastic/elasticsearch`.
* **API RESTful**
* **Búsqueda de Alto Rendimiento:** Utiliza la consulta `multi_match` con `fuzziness: 'AUTO'` para búsquedas tolerantes a errores en múltiples campos (título, contenido, nombre del medio).
* **Filtros Avanzados:** Filtrado por rango de fechas (`fecha_subida`) y por `medio.pais`. Estos filtros se aplican usando la cláusula `filter` en la consulta `bool` de Elastic para optimizar el rendimiento.
* **Paginación:** Manejo eficiente de la paginación a través de los parámetros `from` y `size` de Elasticsearch.
* **Estadísticas (Agregaciones):** El endpoint (`/api/estadisticas`) utiliza agregaciones de Elastic (`min`, `max`, `cardinality`) para proveer el total de registros, el rango de fechas y el conteo de países únicos sin cargar documentos completos.
* **Interfaz Reactiva:** Frontend construido con React y Tailwind CSS.
* **Exportación:** Permite exportar los resultados de la página actual a un archivo CSV.

## Endpoints de la API (Métodos GET)

La API corre en `http://localhost:3000`.

### `GET /api/info`
Devuelve la lista de columnas que el frontend debe renderizar, basadas en la estructura esperada del índice. (Hardcodeado en el backend para simplificar).

> `http://localhost:3000/api/info`

### `GET /api/estadisticas`
Devuelve estadísticas simples usando agregaciones: total de noticias, rango de fechas y países únicos.

> `http://localhost:3000/api/estadisticas`

### `GET /api/buscar`
El endpoint principal para búsqueda y filtrado de noticias.

* **Parámetros (Query Params) disponibles:**
    * `q` (string): Texto libre para buscar en `titulo`, `texto_noticia` y `medio.nombre`. Usa `multi_match`.
    * `pais` (string): Nombre del país para filtrar. Usa `match` en `medio.pais`.
    * `fechaInicio` (string): Fecha de inicio del rango (`YYYY-MM-DD`). Usa cláusula `range`.
    * `fechaFin` (string): Fecha de fin del rango (`YYYY-MM-DD`). Usa cláusula `range`.
    * `pagina` (number): Número de página (ej. `1`).
    * `limite` (number): Resultados por página (ej. `10`).
    * `ordenar` (string): Campo para ordenar (ej. `fecha_subida`).
    * `orden` (string): Dirección de ordenamiento (`asc` o `desc`).

* **Lógica de Consulta Elasticsearch (Query `bool`):**
    1.  **Relevancia (`must`):** Se aplica la búsqueda `q` (texto libre con `multi_match`).
    2.  **Filtro estricto (`must`):** Se aplica el filtro `pais` (match exacto).
    3.  **Filtro de Rango (`filter`):** Se aplica el rango de fechas, optimizado para cacheo y rendimiento.
    4.  **Paginación/Ordenamiento:** Los parámetros `pagina`, `limite`, `ordenar` y `orden` se traducen directamente a `from`, `size` y `sort` en la consulta.

* **Ejemplo de uso:**
    > `http://localhost:3000/api/buscar?q=tecnologia&pais=Chile&fechaInicio=2025-01-01&limite=50`