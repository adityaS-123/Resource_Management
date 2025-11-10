# AI Coding Agent Instructions for Bid Management System

## Project Overview

**Bid Management System** is a Next.js 15 resource management platform with TypeScript, Prisma ORM, and NextAuth.js. It enables organizations to manage project resource requests through a multi-stage approval workflow with department-based hierarchies.

**Architecture Pattern**: Next.js App Router with Server-Sent Components, API Routes for backend logic, and Prisma as the single source of truth for database access.

---

## Critical Architecture Concepts

### 1. Multi-Stage Approval System
The core business logic distinguishes this from typical CRUD apps. Requests flow through **3 approval levels**:
- **Level 1** (Mandatory): Department Head approves
- **Level 2** (Optional): IT Head approves  
- **Level 3** (Optional): Admin final approval

**Implementation Pattern**:
- `ResourceRequest.requiredLevels` field (set on resource template) defines workflow depth
- `ResourceRequest.currentLevel` tracks approval progress (0 = pending, 1+ = in progress)
- `ApprovalRecord` table maintains audit trail with timestamps and comments
- Each level has specific `UserRole` (DEPARTMENT_HEAD, IT_HEAD, ADMIN, IT_TEAM)

**Key Files**: 
- `prisma/schema.prisma` - models: `ResourceRequest`, `ApprovalRecord`, `ResourceTemplate`
- `src/app/api/approvals/route.ts` - approval workflow logic
- `APPROVAL_SYSTEM_GUIDE.md` - comprehensive workflow documentation

### 2. Department-Based Authorization
Departments manage approval hierarchies:
- Users belong to `Department` with `departmentId` foreign key
- Each department has one `head` (one-to-one relation via `headId`)
- Department Heads approve level 1 requests from their department members
- **Pattern**: Always check `session.user.userRole` AND validate department membership when enforcing permissions

### 3. Dynamic Resource Templates
Resources are **template-driven** with configurable fields:
- `ResourceTemplate` defines approval levels and field schema
- `ResourceField` array stores configurable fields (TEXT, EMAIL, NUMBER, SELECT, BOOLEAN, TEXTAREA, URL)
- Fields have validation rules: `minValue`, `maxValue`, `isRequired`, `options` (JSON for SELECT)
- **Pattern**: When rendering forms, dynamically generate inputs based on `ResourceField.fieldType`

### 4. Request Edit Capability (Recent Feature)
Users can edit requests **before Level 1 approval**:
- Edit endpoint: `PUT /api/requests/[id]/edit` validates `currentLevel < 1`
- Edit page: `src/app/user/requests/[id]/edit/page.tsx` renders form based on template fields
- Gating logic: `canEditRequest()` returns false if `status` is REJECTED/APPROVED/ASSIGNED_TO_IT/COMPLETED
- **Pattern**: Edits are blocked after first approval level - enforce this in both API and UI

---

## Database & Prisma Patterns

### Global Prisma Instance
```typescript
// src/lib/prisma.ts - singleton pattern prevents multiple clients
export const prisma = globalForPrisma.prisma ?? new PrismaClient()
```
**Always import from `@/lib/prisma`**, never instantiate directly.

### Common Query Patterns
**Include approval records with relationships:**
```typescript
const request = await prisma.resourceRequest.findUnique({
  where: { id },
  include: {
    approvalRecords: {
      include: { approver: { select: { id: true, name: true, email: true } } },
      orderBy: { level: 'asc' }
    },
    phase: { include: { project: true } },
    resourceTemplate: { include: { fields: { orderBy: { sortOrder: 'asc' } } } }
  }
})
```

**Filter by user role:**
```typescript
// Department head sees only department's requests
const requests = await prisma.resourceRequest.findMany({
  where: {
    phase: {
      project: {
        OR: [
          { createdById: userId },
          { users: { some: { id: userId } } }
        ]
      }
    }
  }
})
```

### Seeding Pattern
`prisma/seed.ts` uses `upsert` for idempotent seeding:
- Departments pre-created with heads assigned
- Test users with role-based passwords (e.g., `DeptHead@123`)
- Run with `npx prisma db seed` after migrations

---

## API Route Conventions

### Session & Auth Pattern
```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Validate role from token
  if (session.user.userRole !== 'DEPARTMENT_HEAD') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
}
```

### Dynamic Route Params
Next.js 15 uses `Promise<{ id: string }>` for params:
```typescript
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params  // Must await!
}
```

### Error Response Standards
```typescript
400 - Invalid input or business logic violation
401 - No session/not authenticated
403 - Authenticated but unauthorized (wrong role/department)
404 - Resource not found
500 - Unexpected server error (include console.error)
```

---

## Frontend Component Patterns

### Server-Side Data Fetching in Client Components
Components use `'use client'` then fetch from API:
```typescript
'use client'
const [data, setData] = useState(null)
useEffect(() => {
  async function fetch() {
    const res = await fetch(`/api/requests/${id}`)
    setData(await res.json())
  }
  fetch()
}, [id])
```

### Form Handling with React Hook Form
Validation uses Zod schemas. Common pattern in request/approval forms:
```typescript
const form = useForm({ resolver: zodResolver(schema) })
form.handleSubmit(async (data) => {
  const res = await fetch('/api/endpoint', { 
    method: 'PUT', 
    body: JSON.stringify(data) 
  })
})
```

### Conditional Rendering Based on Status
```typescript
// Status enum: PENDING, IN_PROGRESS, APPROVED, REJECTED, ASSIGNED_TO_IT, COMPLETED
{request.status === 'PENDING' && <EditButton />}
{request.status === 'IN_PROGRESS' && canEditRequest(request) && <EditButton />}
{request.status === 'COMPLETED' && <ViewOnlyBadge />}
```

### Badge/Status Color Convention
- Blue: PENDING, IN_PROGRESS
- Green: APPROVED, COMPLETED
- Red: REJECTED
- Yellow: ASSIGNED_TO_IT

---

## Email System

Email templates live in `src/lib/email.ts` and use HTML formatting:
- **On request creation**: Notify approvers of pending requests
- **On approval**: Notify requester and next level approvers
- **On rejection**: Notify requester with reason
- **On IT assignment**: Notify IT team with task details

**Pattern**: Templates include request details, approval progress, and action links.

---

## Development Workflows

### Build & Dev Commands
```bash
npm run dev          # Start dev server (port 3000, uses SQLite dev.db)
npm run build        # Turbopack production build (verifies TypeScript + ESLint)
npm run lint         # Run ESLint on all files
```

**Build errors break on**:
- TypeScript type mismatches
- ESLint errors (not just warnings)
- Unused variables trigger warnings (not errors)

### Database Workflows
```bash
npx prisma migrate dev --name <description>  # Create and apply migration
npx prisma studio                             # GUI to view/edit data
npx prisma db seed                            # Run seed.ts
npx prisma migrate reset                      # DROP + recreate from scratch (dev only!)
```

### Testing Features
- No test framework configured (use manual testing)
- `src/app/test-approvals/page.tsx` provides UI for testing approval workflow
- Test accounts in seed: `admin@example.com`, `alice.johnson@example.com`, etc.

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Single source of truth for all models, relations, enums |
| `src/lib/auth.ts` | NextAuth config, JWT callbacks, role handling |
| `src/lib/prisma.ts` | Global Prisma singleton |
| `src/lib/email.ts` | All email template definitions |
| `src/middleware.ts` | Route protection by role |
| `src/app/api/approvals/route.ts` | Approval workflow core logic |
| `src/app/api/requests/route.ts` | Request listing by role |
| `src/app/my-requests/page.tsx` | User request dashboard (includes edit logic) |
| `APPROVAL_SYSTEM_GUIDE.md` | Workflow and configuration documentation |

---

## Common Pitfalls to Avoid

1. **Forgetting `await` on Prisma calls** - Always await async database operations
2. **Not validating department membership** - Check both user role AND department before granting access
3. **Hardcoding approval levels** - Use `requiredLevels` field from template
4. **Missing error handling in API routes** - Wrap logic in try-catch, return proper status codes
5. **Not checking `currentLevel >= 1`** - This indicates if Level 1 approval exists
6. **Forgetting email notifications** - When modifying approval flow, update email triggers
7. **Type mismatches on session.user** - Session has `role` (old) and `userRole` (new), both may be needed

---

## Iteration Strategy When Enhancing Features

1. **Understand the approval flow** - Trace how requests move through levels in `src/app/api/approvals/route.ts`
2. **Identify data model changes** - Update `prisma/schema.prisma` first, then generate migrations
3. **Implement API logic** - Add/modify route handlers in `src/app/api/`
4. **Update UI components** - Modify pages in `src/app/` to reflect new capability
5. **Add email notifications** - Update `src/lib/email.ts` templates
6. **Test with seed data** - Use `npm run dev` and test accounts from seed
7. **Validate build** - Run `npm run build` to catch type errors

