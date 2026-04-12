FROM nginx:latest
COPY index.html /usr/share/nginx/html/index.html


FROM node:lts-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build


FROM nginx:latest
COPY --from=build-stage /app/dist /usr/share/nginx/html