FROM denoland/deno:2.5.4
WORKDIR /app
COPY . .
RUN deno cache main.js
EXPOSE 10000
CMD ["run", "--allow-net", "--allow-read", "--allow-env", "main.js"]
