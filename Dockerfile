# Этап сборки
FROM node:20.11-alpine AS builder

# Создаем директорию приложения
WORKDIR /app

# Копируем файлы package.json и yarn.lock
COPY package*.json yarn.lock ./

# Устанавливаем все зависимости
RUN yarn install

# Копируем исходный код
COPY . .

# Собираем приложение
RUN yarn run build

# Продакшен этап
FROM node:20.11-slim

# Создаем пользователя для приложения
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Создаем директорию приложения и устанавливаем права
WORKDIR /app
RUN chown appuser:appuser /app

# Переключаемся на непривилегированного пользователя
USER appuser

# Копируем файлы package.json и yarn.lock
COPY --from=builder --chown=appuser:appuser /app/package*.json /app/yarn.lock ./

# Устанавливаем только production зависимости
RUN yarn install --production=true

# Копируем собранное приложение
COPY --from=builder --chown=appuser:appuser /app/dist ./dist

# Устанавливаем переменные окружения
ENV PORT=3001
ENV NODE_ENV=production

# Проверка работоспособности
HEALTHCHECK --interval=30s --timeout=3s \
    CMD curl -f http://localhost:${PORT}/health || exit 1

EXPOSE ${PORT}
CMD [ "yarn", "start:prod" ]
