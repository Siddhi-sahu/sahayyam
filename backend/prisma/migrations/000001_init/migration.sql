CREATE EXTENSION IF NOT EXISTS vector;

CREATE TYPE "UserRole" AS ENUM ('FRESHER', 'SENIOR', 'ADMIN');
CREATE TYPE "TipCategory" AS ENUM ('SCHOLARSHIP', 'FACULTY', 'PLACEMENT', 'CLUB', 'DEPARTMENT_NORM', 'ACADEMIC', 'OTHER');
CREATE TYPE "TipStatus" AS ENUM ('PENDING', 'VERIFIED', 'DISPUTED', 'NEEDS_CONTEXT', 'ARCHIVED');
CREATE TYPE "Urgency" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "EvidenceQuality" AS ENUM ('HEARD_FROM_PEER', 'DIRECT_EXPERIENCE', 'REPEATED_PATTERN', 'DOCUMENTED');
CREATE TYPE "VerificationType" AS ENUM ('VERIFY', 'DISPUTE', 'NEEDS_CONTEXT');
CREATE TYPE "ChatRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

CREATE TABLE "College" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "domain" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "College_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Branch" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "collegeId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL,
  "emailVerified" BOOLEAN NOT NULL DEFAULT true,
  "emailVerificationToken" TEXT,
  "semester" INTEGER,
  "graduationYear" INTEGER,
  "isFirstGen" BOOLEAN NOT NULL DEFAULT false,
  "credibilityScore" INTEGER NOT NULL DEFAULT 50,
  "collegeId" TEXT,
  "branchId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Tip" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "summary" TEXT,
  "actionSteps" TEXT[],
  "audience" TEXT,
  "category" "TipCategory" NOT NULL DEFAULT 'OTHER',
  "urgency" "Urgency" NOT NULL DEFAULT 'MEDIUM',
  "status" "TipStatus" NOT NULL DEFAULT 'PENDING',
  "evidenceQuality" "EvidenceQuality" NOT NULL DEFAULT 'DIRECT_EXPERIENCE',
  "sourceConfidence" INTEGER NOT NULL DEFAULT 60,
  "deadline" TIMESTAMP(3),
  "signalRank" INTEGER NOT NULL DEFAULT 0,
  "embedding" vector(1536),
  "authorId" TEXT NOT NULL,
  "collegeId" TEXT NOT NULL,
  "branchId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Tip_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TipVerification" (
  "id" TEXT NOT NULL,
  "tipId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "VerificationType" NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TipVerification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Nudge" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "tipId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "dueAt" TIMESTAMP(3) NOT NULL,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Nudge_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChatSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChatMessage" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "userId" TEXT,
  "role" "ChatRole" NOT NULL,
  "content" TEXT NOT NULL,
  "sources" TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "College_name_key" ON "College"("name");
CREATE UNIQUE INDEX "Branch_collegeId_code_key" ON "Branch"("collegeId", "code");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "Tip_collegeId_branchId_idx" ON "Tip"("collegeId", "branchId");
CREATE INDEX "Tip_status_urgency_idx" ON "Tip"("status", "urgency");
CREATE INDEX "Tip_deadline_idx" ON "Tip"("deadline");
CREATE UNIQUE INDEX "TipVerification_tipId_userId_key" ON "TipVerification"("tipId", "userId");
CREATE INDEX "Nudge_userId_dueAt_idx" ON "Nudge"("userId", "dueAt");
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Tip" ADD CONSTRAINT "Tip_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Tip" ADD CONSTRAINT "Tip_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Tip" ADD CONSTRAINT "Tip_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TipVerification" ADD CONSTRAINT "TipVerification_tipId_fkey" FOREIGN KEY ("tipId") REFERENCES "Tip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TipVerification" ADD CONSTRAINT "TipVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Nudge" ADD CONSTRAINT "Nudge_tipId_fkey" FOREIGN KEY ("tipId") REFERENCES "Tip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
