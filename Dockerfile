FROM oven/bun:1.4.3-slim AS build
WORKDIR /app
COPY package.json bun.lock tsconfig.json ./
RUN bun install --frozen-lockfile
COPY web ./web
COPY src/config ./src/config
COPY src/http/types ./src/http/types
RUN bun run build:web

FROM oven/bun:1.4.3-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json bun.lock tsconfig.json ./
RUN bun install --frozen-lockfile --production
COPY src ./src
COPY agent ./agent
COPY reto-01/fixtures ./reto-01/fixtures
COPY --from=build /app/web/dist ./web/dist
RUN mkdir -p out && chown bun:bun out
USER bun
EXPOSE 10000
CMD ["bun", "src/server.ts"]
