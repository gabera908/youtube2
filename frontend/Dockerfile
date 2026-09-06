# صورة Docker لخدمة الواجهة الأمامية
# Frontend Docker Image
# Uses .dockerignore to exclude unnecessary files

FROM nginx:alpine

COPY . /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
