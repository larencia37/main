# Frontend Dockerfile
FROM node:18-alpine

# Crear directorio de la aplicación
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Build de la aplicación
RUN npm run build

# Servir con nginx
FROM nginx:alpine

# Copiar build de React a nginx
COPY --from=0 /app/build /usr/share/nginx/html

# Copiar configuración de nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Exponer puerto
EXPOSE 3000

# Comando para ejecutar nginx
CMD ["nginx", "-g", "daemon off;"]