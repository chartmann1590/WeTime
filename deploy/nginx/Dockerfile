FROM nginx:alpine

RUN apk add --no-cache openssl

COPY ./deploy/nginx/nginx.conf /etc/nginx/nginx.conf
COPY ./deploy/nginx/ssl-init.sh /docker-entrypoint.d/ssl-init.sh

RUN chmod +x /docker-entrypoint.d/ssl-init.sh

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
