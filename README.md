# API de Búsqueda de Noticias

Sistema de búsqueda y filtrado de noticias, conectado a una base de datos PostgreSQL. Incluye un backend (API RESTful) con Node.js y un frontend (cliente) con React.

## Esquema de la Base de Datos (EN CONSTRUCCIÓN)

Esta API está diseñada para conectarse a una base de datos PostgreSQL. Se asume que la base de datos **CONTIENE UNA TABLA "Noticias"** con la siguiente estructura:

* **Tabla:** `Noticias`
* **Atributos:**
    * `id_noticia` (SERIAL, PRIMARY KEY): Identificador único.
    * `titulo` (TEXT): Título de la noticia.
    * `fecha_subida` (TIMESTAMPTZ): Fecha de publicación (con zona horaria).
    * `largo_noticia` (INTEGER): Conteo de palabras o caracteres.
    * `url` (TEXT): Enlace a la noticia original.

---

## Tecnologías

* **Backend:** Node.js, Express, `node-postgres` (pg)
* **Frontend:** React (Vite), Tailwind CSS
* **Base de Datos:** PostgreSQL

---

## Configuración y Puesta en Marcha

Sigue estos pasos para levantar el entorno completo (Backend + Frontend).

### Backend (API)

1.  Navega a la carpeta `backend/`.
2.  Crea un archivo `.env` en la raíz de `/backend`. Este archivo **es fundamental** y debe contener tus credenciales de PostgreSQL:
    ```ini
    # backend/.env
    DB_USER=usuario
    DB_PASSWORD=contraseña
    DB_HOST=localhost
    DB_DATABASE=nombreBD
    DB_PORT=puertoBD
    ```
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

* **Conexión a PostgreSQL**
* **API RESTful**
* **Búsqueda:** Filtrado por `titulo` de noticia.
* **Filtros Avanzados:** Filtrado por rango de fechas (`fecha_subida`).
* **Paginación:** El backend maneja la paginación.
* **Estadísticas:** Un endpoint dedicado (`/api/estadisticas`) provee el total de registros y rangos de fechas.
* **Interfaz Reactiva:** Frontend construido con React y Tailwind CSS.
* **Exportación:** Permite exportar los resultados de la página actual a un archivo CSV.

## Endpoints de la API (Métodos GET)

La API corre en `http://localhost:3000`. Puedes probar estos endpoints directamente en tu navegador.

### `GET /api/info`
Devuelve información sobre la tabla `Noticias` (columnas, tipo de dato, total de registros).

> `http://localhost:3000/api/info`

### `GET /api/noticias`
Obtiene **todas** las noticias de la base de datos, ordenadas por fecha descendente.

> `http://localhost:3000/api/noticias`

### `GET /api/noticias/:id`
Obtiene una noticia específica por su `id_noticia`.

> `http://localhost:3000/api/noticias/1`

### `GET /api/estadisticas`
Devuelve estadísticas simples: total de noticias y el rango de fechas (primera y última noticia).

> `http://localhost:3000/api/estadisticas`

### `GET /api/buscar`
El endpoint principal para búsqueda y filtrado.

* **Parámetros (Query Params) disponibles:**
    * `q` (string): Texto para buscar en el `titulo`.
    * `fechaInicio` (string): Fecha en formato `YYYY-MM-DD`.
    * `fechaFin` (string): Fecha en formato `YYYY-MM-DD`.
    * `pagina` (number): Número de página (ej. `1`).
    * `limite` (number): Resultados por página (ej. `10`).

* **Ejemplo de uso:**
    > `http://localhost:3000/api/buscar?q=tecnologia&fechaInicio=2025-01-01&pagina=1`