# Imagem base oficial do Node.js LTS
FROM node:22-alpine

# Diretório de trabalho dentro do contêiner
WORKDIR /app

# Copia manifestos de dependência
COPY package*.json ./

# Instala dependências de produção
RUN npm install --omit=dev

# Copia código-fonte da aplicação
COPY . .

# Garante a existência do diretório de uploads
RUN mkdir -p public/uploads

# Porta exposta pela aplicação
EXPOSE 3000

# Variáveis padrão
ENV NODE_ENV=production
ENV PORT=3000

# Inicializa o banco e inicia o servidor
CMD ["node", "server.js"]
