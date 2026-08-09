/*
  Warnings:

  - A unique constraint covering the columns `[did]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "did" TEXT,
ADD COLUMN     "didDocument" TEXT,
ADD COLUMN     "publicKey" TEXT;

-- CreateTable
CREATE TABLE "verifiable_credentials" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "did" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "credential" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "revokedAt" TIMESTAMP(3),
    "revocationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verifiable_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "did_registry" (
    "id" TEXT NOT NULL,
    "did" TEXT NOT NULL,
    "didDocument" TEXT NOT NULL,
    "controller" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,
    "deactivated" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "did_registry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credential_revocation_list" (
    "id" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "issuer" TEXT NOT NULL,

    CONSTRAINT "credential_revocation_list_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "verifiable_credentials_userId_idx" ON "verifiable_credentials"("userId");

-- CreateIndex
CREATE INDEX "verifiable_credentials_did_idx" ON "verifiable_credentials"("did");

-- CreateIndex
CREATE UNIQUE INDEX "did_registry_did_key" ON "did_registry"("did");

-- CreateIndex
CREATE UNIQUE INDEX "credential_revocation_list_credentialId_key" ON "credential_revocation_list"("credentialId");

-- CreateIndex
CREATE INDEX "credential_revocation_list_issuer_idx" ON "credential_revocation_list"("issuer");

-- CreateIndex
CREATE UNIQUE INDEX "users_did_key" ON "users"("did");

-- AddForeignKey
ALTER TABLE "verifiable_credentials" ADD CONSTRAINT "verifiable_credentials_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
