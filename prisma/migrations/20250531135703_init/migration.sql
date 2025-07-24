/*
  Warnings:

  - You are about to drop the column `attempts` on the `OTP` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `OTP` table. All the data in the column will be lost.
  - You are about to drop the column `otpCode` on the `OTP` table. All the data in the column will be lost.
  - You are about to drop the column `phoneNumber` on the `OTP` table. All the data in the column will be lost.
  - Added the required column `otp` to the `OTP` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OTP" DROP COLUMN "attempts",
DROP COLUMN "expiresAt",
DROP COLUMN "otpCode",
DROP COLUMN "phoneNumber",
ADD COLUMN     "otp" TEXT NOT NULL;
