FROM denoland/deno:2.5.4
WORKDIR /app
COPY . .
RUN deno cache main.js
EXPOSE 10000
# Mémoire bornée (offre gratuite Render : 512 Mo)
CMD ["run", "--allow-net", "--allow-read", "--allow-env", "--v8-flags=--max-old-space-size=256", "main.js"]
