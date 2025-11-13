import pandas as pd
import io

file_name = 'dataset_prueba.csv'

print(f"Iniciando un intento de análisis robusto para: {file_name}")
print("El error anterior ('Expected 6 fields... saw 15') indica una línea mal formada.")
print("Intentaremos de nuevo, esta vez usando el motor de Python y omitiendo las líneas con errores.")

try:
    # Paso 1: Cargar el archivo "exterior" (delimitado por ';')
    # Usamos header=None porque la primera línea es el "encabezado" del CSV interno,
    # no del archivo exterior.
    df_outer = pd.read_csv(file_name, sep=';', encoding='latin1', header=None)

    # Paso 2: Extraer la primera columna, que contiene todas las cadenas de CSV.
    # Usamos .dropna() para eliminar filas que podrían estar completamente vacías.
    csv_data_series = df_outer.iloc[:, 0].dropna()

    # Paso 3: Combinar la serie de cadenas en una sola gran cadena.
    # Cada elemento es una fila del CSV interno.
    full_csv_string = '\n'.join(csv_data_series.to_list())

    # Paso 4: Usar io.StringIO para tratar esta cadena como un archivo.
    csv_file_in_memory = io.StringIO(full_csv_string)

    # Paso 5: Leer el archivo en memoria con pandas.
    # --- Esta es la parte clave ---
    # sep=',' : El delimitador interno es la coma.
    # engine='python' : Usamos el motor de Python, que es más lento pero más flexible
    #                   y maneja mejor los casos de comillas complejas.
    # on_bad_lines='skip' : Si encontramos una línea imposible de analizar (como la línea 143
    #                     que causó el error anterior), la omitimos en lugar de
    #                     detener todo el proceso.
    print("Analizando el CSV interno con: sep=',', engine='python', on_bad_lines='skip'")
    
    df_clean = pd.read_csv(csv_file_in_memory, 
                           sep=',', 
                           engine='python', 
                           on_bad_lines='skip')

    print("\n--- ¡Éxito! Se procesaron los datos CSV internos ---")
    
    # Arreglar los nombres de las columnas.
    # El encabezado original era "date,country,""media_outlet"",text,title,url"
    # El parseador puede haberlos leído como 'date', 'country', '"media_outlet"', etc.
    # Vamos a limpiarlos.
    df_clean.columns = df_clean.columns.str.strip().str.strip('"')
    
    print("\n--- Información del DataFrame Limpio ---")
    df_clean.info()
    
    print("\n--- Encabezado del DataFrame Limpio (Columnas Limpias) ---")
    print(df_clean.head())

    # Paso 6: Guardar los datos limpios en un nuevo CSV
    clean_csv_filename = 'dataset_prueba_limpio.csv'
    df_clean.to_csv(clean_csv_filename, index=False)
    print(f"\nSe guardaron exitosamente los datos limpios en '{clean_csv_filename}'")
    print(f"El archivo '{clean_csv_filename}' está ahora disponible para descargar.")

except Exception as e:
    print(f"\nOcurrió un error durante el proceso de limpieza robusto: {e}")
    print("Este archivo es excepcionalmente complejo o está dañado.")