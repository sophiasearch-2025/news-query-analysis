# Subsistema de Búsqueda y Filtrado de Noticias

## 1. Propósito
Este subsistema gestiona la consulta, filtrado y análisis de noticias indexadas. Su función principal es actuar como una capa de abstracción entre el cliente (Frontend) y el motor de búsqueda (Elasticsearch), procesando las peticiones para entregar resultados ordenados y estadísticas sobre la colección de datos disponible.

## 2. Interacción con otros subsistemas
Este componente interactúa con los siguientes elementos del sistema:

* **Subsistema de Interfaz de Usuario (Frontend):** Consume los servicios REST expuestos (`/api/search`, `/api/filters`) para mostrar noticias y opciones de filtrado al usuario final.
* **Motor de Búsqueda (Elasticsearch):** Provee el almacenamiento indexado y las capacidades de recuperación de información. El subsistema realiza consultas DSL a este componente.
* **Subsistema de Almacenamiento/Ingesta (Externo):** Aunque no interactúa directamente en tiempo real, este subsistema depende de que los datos hayan sido indexados previamente con la estructura correcta por el proceso de ingesta.

**Flujo general de datos:**
1.  Recepción de parámetros HTTP desde el cliente.
2.  Construcción de consulta para Elasticsearch.
3.  Recuperación de datos crudos desde el motor de búsqueda.
4.  Procesamiento, filtrado y ordenamiento en memoria (capa de aplicación).
5.  Retorno de respuesta JSON estructurada al cliente.

## 3. Documentación interna
A continuación se listan los documentos detallados del subsistema:

* [Arquitectura del Subsistema](./ARQUITECTURA.md)
* [Decisiones Técnicas](./DECISIONES.md)
* [Requisitos del Sistema](./REQUISITOS.md)
* [Guía de Despliegue](./DEPLOY.md)

## 4. Estado del subsistema
**Estado:** Funcional.

Actualmente, el subsistema implementa la totalidad de los endpoints requeridos para la búsqueda y filtrado. Se ha integrado una solución de lógica híbrida (búsqueda en Elastic, filtrado en Node.js) para sortear limitaciones en el mapeo del índice actual. Los endpoints han sido verificados mediante pruebas manuales y están listos para integración con el frontend.
