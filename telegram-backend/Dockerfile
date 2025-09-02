# Imagen base oficial de Node.js
FROM node:20

# Crear y usar el directorio de la app
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install --production

# Copiar el resto del código
COPY . .

# Exponer el puerto que usa Express
EXPOSE 3000

# Comando de inicio
CMD ["npm", "start"]
