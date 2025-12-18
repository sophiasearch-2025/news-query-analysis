# Registro de Decisiones Técnicas (ADR)

## ADR-001: Implementación de Lógica de Filtrado en Capa de Aplicación

### Estado
Aceptado

### Contexto
El índice de Elasticsearch proporcionado (`noticias`) define campos críticos como `country`, `media_outlet` y `date` exclusivamente como tipo `text`. Elasticsearch deshabilita por defecto la carga de datos en memoria (*fielddata*) para campos de texto debido al alto consumo de recursos, lo que impide realizar operaciones de agregación (para obtener listas de filtros) y ordenamiento nativo.

### Decisión
Se decidió implementar la lógica de **filtrado exacto, ordenamiento y agregación (conteo de únicos)** directamente en el servidor Node.js (JavaScript), en lugar de utilizar las capacidades nativas de Elasticsearch Query DSL para estas tareas específicas.

### Consecuencias
* **Positivas:**
    * Se evita la necesidad de reindexar la base de datos completa, lo cual podría ser costoso o inviable en el corto plazo.
    * Se eliminan los errores de tipo `illegal_argument_exception` relacionados con *fielddata*.
    * Se garantiza el funcionamiento correcto de los filtros independientemente de la configuración del índice.
* **Negativas:**
    * Se introduce un límite técnico en la cantidad de documentos procesables (`MAX_RESULTS_FOR_JS`), ya que los datos deben cargarse en la memoria del servidor Node.js.
    * El rendimiento podría verse afectado si el volumen de noticias recuperadas aumenta drásticamente.

### Mitigación
Se establece un límite de documentos recuperados (ej. 2000) que es suficiente para el caso de uso actual, equilibrando rendimiento y funcionalidad.
