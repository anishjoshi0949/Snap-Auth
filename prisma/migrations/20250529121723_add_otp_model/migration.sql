-- CreateTable
CREATE TABLE "OTP" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "otpCode" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OTP_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OTP_userId_idx" ON "OTP"("userId");
