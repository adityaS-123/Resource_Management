# Multi-Stage Approval System Implementation

## Overview

This document describes the comprehensive multi-stage approval system implemented for resource management. The system allows configurable approval levels for different resource types and manages the complete workflow from request submission to IT team assignment.

## Approval Levels

The system supports 3 approval levels (1-3). **Level 1 approval is mandatory for all requests**.

- **Level 1**: Department Head approval required (MANDATORY)
- **Level 2**: Level 1 → IT Head approval required  
- **Level 3**: Level 1 → Level 2 → Admin approval required

**Note**: Auto-approval (Level 0) has been eliminated. All requests now require at least Level 1 approval.

## Database Schema

### New Models

#### ApprovalRecord
```prisma
model ApprovalRecord {
  id              String        @id @default(cuid())
  requestId       String
  level           Int           // Approval level (1, 2, 3)
  approverId      String
  status          ApprovalStatus
  comments        String?
  approvedAt      DateTime?
  createdAt       DateTime      @default(now())
  
  request         ResourceRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)
  approver        User            @relation(fields: [approverId], references: [id])
}
```

#### Enhanced ResourceRequest
```prisma
model ResourceRequest {
  // ... existing fields
  currentLevel     Int              @default(0)  // Current approval level
  requiredLevels   Int              @default(0)  // Required approval levels (0-3)
  approvalRecords  ApprovalRecord[]
}
```

#### Enhanced ResourceTemplate
```prisma
model ResourceTemplate {
  // ... existing fields
  approvalLevels   Int              @default(0)  // Required approval levels (0-3)
}
```

### New Enums

```prisma
enum UserRole {
  REGULAR_USER
  DEPARTMENT_HEAD
  IT_HEAD
  ADMIN
  IT_TEAM
}

enum ApprovalStatus {
  PENDING_APPROVAL
  APPROVED
  REJECTED
  ASSIGNED_TO_IT
}
```

## API Implementation

### Approval Endpoint: `/api/approvals`

**POST Request Body:**
```json
{
  "requestId": "string",
  "action": "approve" | "reject",
  "comments": "string (optional)"
}
```

**Workflow Logic:**
1. Validates user has permission to approve at current level
2. Creates approval record
3. Updates request status and level
4. Sends notifications to next approvers or IT team
5. Handles final approval by assigning to IT team

### Authorization Levels

- **Level 1**: Department Head (`DEPARTMENT_HEAD` role)
- **Level 2**: IT Head (`IT_HEAD` role)  
- **Level 3**: Admin (`ADMIN` role)

## Email Notification System

### New Template: Approval Notifications

The system sends email notifications for:
- **PENDING_APPROVAL**: To next level approvers
- **APPROVED**: To requester when fully approved
- **REJECTED**: To requester with rejection reason
- **ASSIGNED_TO_IT**: To IT team members for provisioning

### Email Features

- Dynamic styling based on approval status
- Comprehensive request details
- Configuration information display
- Action buttons for approvers
- Progress tracking information

## Workflow Examples

### Level 1 Approval (Department Head Only)
1. User submits request for Level 1 resource
2. Department Head receives notification
3. Department Head approves/rejects
4. If approved → Assigned to IT team
5. IT team receives task assignment

### Level 3 Approval (Full Workflow)
1. User submits request for Level 3 resource
2. Department Head receives notification (Level 1)
3. Department Head approves → IT Head notified (Level 2)
4. IT Head approves → Admin notified (Level 3)
5. Admin approves → Assigned to IT team
6. IT team receives task assignment

## Testing

### Test Page: `/test-approvals`

A comprehensive test interface that allows:
- Creating test requests with different approval levels
- Simulating approval/rejection actions
- Viewing approval progress
- Understanding the workflow visually

### Test Features

- **Visual Progress Bars**: Show approval progress
- **Status Badges**: Color-coded request statuses
- **Action Buttons**: Approve/reject functionality
- **Workflow Explanation**: Clear documentation of each level

## Configuration

### Resource Template Setup

When creating resource templates, set the `approvalLevels` field:
```typescript
const template = await prisma.resourceTemplate.create({
  data: {
    name: "High-Performance Server",
    approvalLevels: 3, // Requires full 3-level approval
    // ... other fields
  }
})
```

### User Role Assignment

Assign appropriate roles to users:
```typescript
const user = await prisma.user.update({
  where: { id: userId },
  data: {
    role: "DEPARTMENT_HEAD" // or IT_HEAD, ADMIN, IT_TEAM
  }
})
```

## Email Configuration

Set up SMTP configuration in `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="Resource Management System <your-email@gmail.com>"
```

## Security Features

- **Role-based Authorization**: Users can only approve at their authorized level
- **Audit Trail**: All approval actions recorded with timestamps and comments
- **Status Validation**: Prevents duplicate approvals and ensures proper workflow
- **Error Handling**: Comprehensive error messages and logging

## Next Steps

1. **Integration Testing**: Test with real user accounts and email delivery
2. **UI Enhancement**: Add approval dashboard for managers
3. **Reporting**: Create approval analytics and reporting features
4. **Mobile Support**: Optimize email templates for mobile devices
5. **Escalation**: Add automatic escalation for overdue approvals

## Files Modified/Created

### Database
- `prisma/schema.prisma` - Enhanced with approval models and enums
- Database migration applied successfully

### API Endpoints
- `src/app/api/approvals/route.ts` - New approval processing endpoint

### Email System
- `src/lib/email.ts` - Enhanced with approval notification templates

### Testing
- `src/app/test-approvals/page.tsx` - Comprehensive test interface

### Types
- Enhanced TypeScript interfaces for approval data structures

This implementation provides a robust, scalable multi-stage approval system that can handle complex organizational approval workflows while maintaining clear audit trails and comprehensive notification systems.