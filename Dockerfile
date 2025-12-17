# Imagen base ligera de Node.js
FROM node:25-alpine

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia de archivos de dependencias
COPY package*.json ./

# Instalación de dependencias
RUN npm install

# Copia del código fuente
COPY . .

# Exposición del puerto de la aplicación
EXPOSE 3000

# Comando de inicio
CMD ["node", "server.js"]
