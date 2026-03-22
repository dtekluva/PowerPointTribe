FROM nginx:alpine

# Remove the default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/sunday-orders.conf

# Copy all static frontend files
COPY *.html *.js *.css /usr/share/nginx/html/

EXPOSE 80

