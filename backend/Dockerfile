# Imagem única para todos os serviços. O comando (qual serviço rodar) é
# definido por serviço no docker-compose.yml.
FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY shared ./shared
COPY services ./services
# Comando padrão sobrescrito por serviço no compose.
CMD ["node", "services/gateway/index.js"]
