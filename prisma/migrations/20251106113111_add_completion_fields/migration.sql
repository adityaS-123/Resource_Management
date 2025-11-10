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
    "completedAt" DATETIME,
    "completedById" TEXT,
    "completionNotes" TEXT,
    "credentials" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ResourceRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ResourceRequest_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "Phase" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ResourceRequest_resourceTemplateId_fkey" FOREIGN KEY ("resourceTemplateId") REFERENCES "ResourceTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ResourceRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ResourceRequest_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ResourceRequest" ("approvedAt", "approvedById", "assignedToIT", "createdAt", "currentLevel", "id", "itTaskDetails", "justification", "phaseId", "rejectionReason", "requestedConfig", "requestedQty", "requiredLevels", "resourceId", "resourceTemplateId", "resourceType", "status", "updatedAt", "userId") SELECT "approvedAt", "approvedById", "assignedToIT", "createdAt", "currentLevel", "id", "itTaskDetails", "justification", "phaseId", "rejectionReason", "requestedConfig", "requestedQty", "requiredLevels", "resourceId", "resourceTemplateId", "resourceType", "status", "updatedAt", "userId" FROM "ResourceRequest";
DROP TABLE "ResourceRequest";
ALTER TABLE "new_ResourceRequest" RENAME TO "ResourceRequest";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
