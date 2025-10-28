# News Query Analysis - API FastAPI

Este repositorio contiene la API para consultar noticias indexadas en ElasticSearch y scripts de análisis relacionados.

## Estructura del repositorio

```
news-query-analysis/
│
├── api/
│   └── news_api.py       ← FastAPI para búsqueda full-text
├── scripts/              ← scripts de análisis opcionales
└── README.md
```

## Requisitos

* Python 3 + pip
* FastAPI
* Uvicorn
* Elasticsearch Python client

Se recomienda usar un entorno virtual (`venv`) para instalar dependencias.

## Instalación de dependencias

Desde la carpeta `api/`:

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Contenido recomendado para `requirements.txt`:

```
elasticsearch==8.8.1
fastapi==0.111.1
uvicorn==0.25.0
```

## Ejecutar la API

```bash
cd api
uvicorn news_api:app --reload --host 0.0.0.0 --port 8000
```

* `--reload` recarga automáticamente si hay cambios en el código.
* `--host 0.0.0.0` permite acceder desde otras máquinas si el puerto está abierto.

## Probar la API

```
http://localhost:8000/search?q=palabra_clave
```

Retorna resultados de noticias indexadas en ElasticSearch, incluyendo título, texto, medio y URL.

## Notas

* ElasticSearch debe estar corriendo (por ejemplo, usando `data-storage-manager/elasticsearch`).
* Mantener el puerto 9200 expuesto mientras se realizan pruebas de conexión desde la API.
* Documentar cambios y actualizaciones en este README
