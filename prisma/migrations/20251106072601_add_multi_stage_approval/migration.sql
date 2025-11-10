/*
  Warnings:

  - A unique constraint covering the columns `[projectId,name]` on the table `Phase` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Resource" ADD COLUMN "identifier" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "userRole" TEXT;

-- CreateTable
CREATE TABLE "ProjectInvitation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectInvitation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ApprovalRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resourceRequestId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "approvalLevel" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "comments" TEXT,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ApprovalRecord_resourceRequestId_fkey" FOREIGN KEY ("resourceRequestId") REFERENCES "ResourceRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ApprovalRecord_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ResourceRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "phaseId" TEXT NOT NULL,
    "resourceTemplateId" TEXT,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "requestedConfig" TEXT NOT NULL,
    "requestedQty" INTEGER NOT NULL,
    "justification" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "currentLevel" INTEGER NOT NULL DEFAULT 0,
    "requiredLevels" INTEGER NOT NULL DEFAULT 0,
    "rejectionReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" DATETIME,
    "approvedById" TEXT,
    "assignedToIT" BOOLEAN NOT NULL DEFAULT false,
    "itTaskDetails" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ResourceRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ResourceRequest_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "Phase" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ResourceRequest_resourceTemplateId_fkey" FOREIGN KEY ("resourceTemplateId") REFERENCES "ResourceTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ResourceRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ResourceRequest" ("approvedAt", "approvedById", "createdAt", "id", "justification", "phaseId", "rejectionReason", "requestedConfig", "requestedQty", "resourceId", "resourceTemplateId", "resourceType", "status", "updatedAt", "userId") SELECT "approvedAt", "approvedById", "createdAt", "id", "justification", "phaseId", "rejectionReason", "requestedConfig", "requestedQty", "resourceId", "resourceTemplateId", "resourceType", "status", "updatedAt", "userId" FROM "ResourceRequest";
DROP TABLE "ResourceRequest";
ALTER TABLE "new_ResourceRequest" RENAME TO "ResourceRequest";
CREATE TABLE "new_ResourceTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "approvalLevels" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ResourceTemplate" ("createdAt", "description", "id", "isActive", "name", "updatedAt") SELECT "createdAt", "description", "id", "isActive", "name", "updatedAt" FROM "ResourceTemplate";
DROP TABLE "ResourceTemplate";
ALTER TABLE "new_ResourceTemplate" RENAME TO "ResourceTemplate";
CREATE UNIQUE INDEX "ResourceTemplate_name_key" ON "ResourceTemplate"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ProjectInvitation_email_projectId_key" ON "ProjectInvitation"("email", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalRecord_resourceRequestId_approvalLevel_key" ON "ApprovalRecord"("resourceRequestId", "approvalLevel");

-- CreateIndex
CREATE UNIQUE INDEX "Phase_projectId_name_key" ON "Phase"("projectId", "name");
