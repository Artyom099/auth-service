<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="App Logo" /></a>
</p>

<p align="center">
    <img src="https://img.shields.io/badge/Nest-10.0.0-red" alt="Nest version" />
    <img src="https://img.shields.io/badge/Version-v1.0-green" alt="App version" />
    <img src="https://img.shields.io/badge/License-MIT-blue" alt="License" />
</p>

## Description

Project stack: Nest, Postgres, TypeORM, Docker, Docker Compose, TypeScript, Jest, Swagger

## Distribute

In progress

## Documentation

Сервис предоставляет следующие API эндпоинты:

### Регистрация и подтверждение email
- `POST /auth/registration` - Регистрация нового пользователя

- `POST /auth/registration-confirmation` - Подтверждение email после регистрации

- `POST /auth/resend-confirmation-code` - Повторная отправка кода подтверждения

### Аутентификация
- `POST /auth/login` - Вход в систему

- `POST /auth/refresh-token` - Обновление токенов

- `GET /auth/me` - Получение информации о текущем пользователе

- `POST /auth/logout` - Выход из системы

### Восстановление пароля
- `POST /auth/password-recovery` - Запрос на восстановление пароля

- `POST /auth/confirm-password-recovery` - Подтверждение восстановления пароля

- `POST /auth/update-password` - Установка нового пароля

### OAuth Аутентификация
- `POST /auth/oauth/:type` - Аутентификация через внешние сервисы
  - Параметр пути: type (google, github)
  - Тело запроса: code (код авторизации от провайдера)
  - Ответ: accessToken
  - Cookie: refreshToken

### Управление устройствами
- `GET /device` - Получение списка устройств пользователя

- `DELETE /device` - Удаление всех устройств кроме текущего

- `DELETE /device/:id` - Удаление конкретного устройства

Все эндпоинты имеют ограничение: не более 5 запросов с одного IP-адреса в течение 10 секунд.

Шаги разработки:
- написать правильный Dockerfile
- выдача прав доступа пользователю
- управление ролевой моделью
- регитсрация сторонних сервисов в сервисе авторизации???


## Developers

 - [Artyom Golubev](https://github.com/Artyom099)

## License

This project is distributed under the [MIT license]()

### Создание миграции
```
typeorm migration:create ./src/libs/db/migration/MIGRATION_NAME
```

```
model User {
  id                    Int                    @id @default(autoincrement())
  login                 String                 @unique
  email                 String?                @unique
  passwordHash          String?
  createdAt             DateTime               @default(now()) @db.Timestamp(6)
  isEmailConfirmed      Boolean                @default(false)
  photoUrl              String?
  google                GoogleUser?
  offerheap             OfferheapUser?
  devices               Device[]
  github                GithubUser?
  emailConfirmationInfo UserEmailConfirmation?
  passwordRecoveryInfo  UserPasswordRecovery?
}

model UserEmailConfirmation {
  confirmationCode String   @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  expirationDate   DateTime @db.Timestamp(6)
  isConfirmed      Boolean  @default(false)
  userId           Int      @unique
  email            String   @unique
  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model UserPasswordRecovery {
  recoveryCode   String   @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  expirationDate DateTime @db.Timestamp(6)
  isConfirmed    Boolean  @default(false)
  userId         Int      @unique
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model GithubUser {
  id       Int    @id
  username String
  photoUrl String
  userId   Int    @unique
  email    String
  user     User   @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model GoogleUser {
  email    String
  photoUrl String?
  userId   Int     @unique
  id       String  @id
  username String
  user     User    @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model OfferheapUser {
  id       Int    @id
  username String
  photoUrl String
  userId   Int    @unique
  email    String
  user     User   @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Device {
  id         String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  ip         String
  deviceName String
  issuedAt   DateTime @db.Timestamp(6)
  userId     Int
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```