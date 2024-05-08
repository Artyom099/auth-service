-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "login" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isEmailConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "photoUrl" TEXT,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_email_confirmation" (
    "confirmationCode" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "expirationDate" TIMESTAMP(6) NOT NULL,
    "isConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "userId" INTEGER NOT NULL,
    "email" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "user_password_recovery" (
    "recoveryCode" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "expirationDate" TIMESTAMP(6) NOT NULL,
    "isConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "userId" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "github_user" (
    "id" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "github_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoogleUser" (
    "email" TEXT NOT NULL,
    "photoUrl" TEXT,
    "userId" INTEGER NOT NULL,
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,

    CONSTRAINT "GoogleUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferheapUser" (
    "id" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "OfferheapUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "ip" TEXT NOT NULL,
    "deviceName" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(6) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "device_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_login_key" ON "user"("login");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_id_login_key" ON "user"("id", "login");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_confirmation_userId_key" ON "user_email_confirmation"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_confirmation_email_key" ON "user_email_confirmation"("email");

-- CreateIndex
CREATE INDEX "user_email_confirmation_code_index" ON "user_email_confirmation"("confirmationCode");

-- CreateIndex
CREATE UNIQUE INDEX "user_password_recovery_userId_key" ON "user_password_recovery"("userId");

-- CreateIndex
CREATE INDEX "user_password_recovery_code_index" ON "user_password_recovery"("recoveryCode");

-- CreateIndex
CREATE UNIQUE INDEX "github_user_userId_key" ON "github_user"("userId");

-- CreateIndex
CREATE INDEX "github_user_id_index" ON "github_user"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleUser_userId_key" ON "GoogleUser"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OfferheapUser_userId_key" ON "OfferheapUser"("userId");

-- AddForeignKey
ALTER TABLE "user_email_confirmation" ADD CONSTRAINT "user_email_confirmation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_password_recovery" ADD CONSTRAINT "user_password_recovery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "github_user" ADD CONSTRAINT "github_user_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoogleUser" ADD CONSTRAINT "GoogleUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferheapUser" ADD CONSTRAINT "OfferheapUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device" ADD CONSTRAINT "device_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
