FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV VITE_SUMAQAGRO_PLATFORM_API_URL=/api/v1
RUN npm run build

FROM nginx:alpine
ENV PORT=80 BACKEND_URL=http://backend:8080 NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1
ENV NGINX_ENVSUBST_FILTER="^(PORT|BACKEND_URL|NGINX_LOCAL_RESOLVERS)$"
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
