FROM node:20-alpine AS build
WORKDIR /app
ARG DATABASE_URL=postgresql://postgres:postgres@postgres:5432/priv-chat
ENV DATABASE_URL=${DATABASE_URL}
COPY . .
RUN npx prisma generate && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/scripts/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh
EXPOSE 3000
CMD ["./entrypoint.sh"]
