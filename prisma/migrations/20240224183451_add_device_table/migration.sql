-- CreateTable
CREATE TABLE "device" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "ip" TEXT NOT NULL,
    "deviceName" TEXT NOT NULL,
    "issuedAt" TIMESTAMP NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "device_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "device" ADD CONSTRAINT "device_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
