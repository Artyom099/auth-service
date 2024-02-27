-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "login" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_email_confirmation" (
    "confirmationCode" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "expirationDate" TIMESTAMP NOT NULL,
    "isConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "user_email_confirmation_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "user_password_recovery" (
    "recoveryCode" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "expirationDate" TIMESTAMP NOT NULL,
    "isConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "user_password_recovery_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_login_key" ON "user"("login");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_id_login_key" ON "user"("id", "login");

-- AddForeignKey
ALTER TABLE "user_email_confirmation" ADD CONSTRAINT "user_email_confirmation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_password_recovery" ADD CONSTRAINT "user_password_recovery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
