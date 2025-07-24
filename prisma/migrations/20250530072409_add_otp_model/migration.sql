-- AlterTable
CREATE SEQUENCE otp_attempts_seq;
ALTER TABLE "OTP" ALTER COLUMN "attempts" SET DEFAULT nextval('otp_attempts_seq');
ALTER SEQUENCE otp_attempts_seq OWNED BY "OTP"."attempts";
