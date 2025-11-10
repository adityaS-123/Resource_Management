# Department Feature - System Architecture

## 🏗️ Overall Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER FLOW                             │
└─────────────────────────────────────────────────────────────┘

REGISTRATION
    ↓
┌─────────────────────────────────────────────────────────────┐
│  1. User visits /login → "Create new account"               │
│  2. Fills form:                                             │
│     - Email, Name, Password                                │
│     - Selects Department (dropdown)                        │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│  Frontend: src/app/login/page.tsx                           │
│  - Loads departments from /api/departments                  │
│  - Shows Select component with options                      │
│  - Submits to /api/auth/register with departmentId          │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│  Backend: src/app/api/auth/register/route.ts               │
│  - Validates departmentId exists                            │
│  - Creates user with departmentId                           │
│  - User now linked to department                            │
│  - User linked to department.head as approver               │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│  Login → Redirect to dashboard                              │
│  - User now part of their department                        │
│  - Can submit resource requests                             │
│  - Requests route to department head first                  │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Database Schema Relationships

```
┌──────────────────────────────────────┐
│        Department                    │
├──────────────────────────────────────┤
│ id          (PK)                     │
│ name        (UNIQUE)                 │
│ description                          │
│ headId      (FK → User.id) (UNIQUE)  │
│ createdAt                            │
│ updatedAt                            │
└──────────────────────────────────────┘
      ↓ (one-to-one)        ↓ (one-to-many)
┌──────────────────────────────────────┐
│        User                          │
├──────────────────────────────────────┤
│ id          (PK)                     │
│ email       (UNIQUE)                 │
│ name                                 │
│ password                             │
│ role        (ADMIN, USER)            │
│ userRole    (DEPT_HEAD, REGULAR_...)│
│ departmentId (FK → Department.id)   │
│ createdAt                            │
│ updatedAt                            │
└──────────────────────────────────────┘
      ↓ (submits requests)
┌──────────────────────────────────────┐
│   ResourceRequest                    │
├──────────────────────────────────────┤
│ id                                   │
│ userId      (FK → User.id)           │
│ status      (IN_PROGRESS, ...)       │
│ currentLevel                         │
│ requiredLevels                       │
└──────────────────────────────────────┘
```

## 🔀 Data Flow Diagram

```
┌─────────────────┐
│  Registration   │
│   Form (UI)     │
└────────┬────────┘
         │ (POST with departmentId)
         ↓
┌─────────────────────────────────────────┐
│  /api/auth/register                     │
│  - Validate department exists            │
│  - Hash password                         │
│  - Create User with departmentId        │
└────────┬────────────────────────────────┘
         │ (Save to DB)
         ↓
┌─────────────────────────────────────────┐
│  Prisma Client                          │
│  - INSERT user row                      │
│  - Set departmentId FK                  │
└────────┬────────────────────────────────┘
         │ (Store)
         ↓
┌─────────────────────────────────────────┐
│  SQLite Database                        │
│  - User table (new row)                 │
│  - Department relation linked           │
│  - Department.head becomes approver     │
└─────────────────────────────────────────┘
```

## 🔄 Request Approval Flow

```
User from Engineering Department
    ↓
Submits Resource Request
    ↓
System identifies department (from User.departmentId)
    ↓
Routes to Department Head
    (Alice Johnson - Engineering Head)
    ↓
┌─────────────────────────────────────┐
│ Department Head Approves            │
│ (Level 1 approval)                  │
└────────┬────────────────────────────┘
         │
         ├─→ Approved → Next Level
         │
         └─→ Rejected → End
```

## 📱 Component Architecture

```
Login Page
├── Registration Form (when isRegister=true)
│   ├── Email Input
│   ├── Name Input
│   ├── Department Select
│   │   └── Fetches from /api/departments
│   ├── Password Input
│   └── Register Button (submits to /api/auth/register)
│
└── Login Form (when isRegister=false)
    ├── Email Input
    ├── Password Input
    └── Login Button
```

## 🗂️ File Structure

```
bid-management/
├── prisma/
│   ├── schema.prisma              ← Department model added
│   ├── seed.ts                    ← Departments & heads auto-created
│   └── migrations/
│       └── 20251110052929_add_department_model/
│           └── migration.sql
│
├── src/
│   ├── app/
│   │   ├── login/
│   │   │   └── page.tsx           ← Department dropdown added
│   │   │
│   │   └── api/
│   │       ├── auth/
│   │       │   └── register/
│   │       │       └── route.ts   ← departmentId validation added
│   │       │
│   │       └── departments/
│   │           └── route.ts       ← NEW: Departments API
│   │
│   └── types/
│       └── next-auth.d.ts         ← Department type definitions
│
├── INTEGRATED_SEED_SETUP.md       ← NEW: Complete setup guide
├── QUICK_START_DEPARTMENTS.md     ← NEW: Quick reference
└── DEPARTMENT_IMPLEMENTATION_COMPLETE.md ← NEW: Summary
```

## 🔑 Key Models (TypeScript Types)

```typescript
// Department with relationships
interface Department {
  id: string
  name: string                    // "Engineering", "Operations", etc.
  description?: string
  head?: User                     // Department head user
  headId?: string                 // Foreign key to head user
  members: User[]                 // All users in department
  createdAt: Date
  updatedAt: Date
}

// User with department
interface User {
  id: string
  email: string
  name: string
  password: string
  role: "ADMIN" | "USER"
  userRole: "ADMIN" | "DEPARTMENT_HEAD" | "IT_HEAD" | "REGULAR_USER"
  
  // NEW: Department fields
  department?: Department         // User's department
  departmentId?: string           // Foreign key to department
  headedDepartment?: Department   // If user is a head
}

// Resource Request with department routing
interface ResourceRequest {
  id: string
  user: User                      // Requester
  status: "IN_PROGRESS" | "APPROVED" | "REJECTED"
  currentLevel: number            // Current approval stage
  requiredLevels: number          // How many approvals needed
  
  // ROUTING: Based on user.department.head
  nextApprover?: User             // Department head for first approval
}
```

## 🔌 API Endpoints

```
GET /api/departments
├─ Purpose: Get department list for registration dropdown
├─ Returns: [ { id, name, description, head: { id, name, email } } ]
└─ Used by: login page during registration

POST /api/auth/register
├─ Body: { email, name, password, departmentId }
├─ Validates: department exists in database
├─ Creates: User with department assignment
├─ Links: user to department.head as approver
└─ Returns: { user, session }

GET/POST /api/departments (future)
├─ Admin feature for department management
└─ (Not yet fully implemented UI)
```

## 🧪 Test Workflow

```
┌─────────────────────────────────────────┐
│ Test 1: Register New User              │
├─────────────────────────────────────────┤
│ 1. Go to /login                         │
│ 2. Click "Create new account"           │
│ 3. Fill form + select "Engineering"     │
│ 4. Register successful ✓                │
│ 5. Login with new credentials ✓         │
│ 6. Profile shows Engineering ✓          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Test 2: Department Head Login          │
├─────────────────────────────────────────┤
│ 1. Login as alice.johnson@..            │
│    Password: DeptHead@123               │
│ 2. Dashboard shows role: DEPARTMENT_HEAD│
│ 3. Can see requests from department ✓   │
│ 4. Can approve/reject requests ✓        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Test 3: Database Verification          │
├─────────────────────────────────────────┤
│ 1. Run: npx prisma studio              │
│ 2. View Department table ✓              │
│ 3. 4 departments visible ✓              │
│ 4. Each has head assigned ✓             │
│ 5. Users linked to departments ✓        │
└─────────────────────────────────────────┘
```

## 🎯 Implementation Checklist

```
Database Layer
  ✅ Department model created
  ✅ User.departmentId added
  ✅ Relationships configured
  ✅ Migration created & applied
  ✅ Seed script updated

API Layer
  ✅ /api/departments GET endpoint
  ✅ /api/departments POST endpoint (future admin use)
  ✅ /api/auth/register updated with validation
  ✅ Department validation implemented
  ✅ Error handling added

Frontend Layer
  ✅ Login page updated
  ✅ Department dropdown added
  ✅ Dynamic loading implemented
  ✅ Form submission updated
  ✅ Error messages added

Seed / Data Layer
  ✅ 4 departments created automatically
  ✅ 4 department heads created
  ✅ Heads assigned to departments
  ✅ All data verified in output
  ✅ Idempotent script (safe to re-run)

Build & Deployment
  ✅ Build successful
  ✅ No blocking errors
  ✅ TypeScript validation passed
  ✅ All imports correct
  ✅ Ready for production
```

## 🚀 Quick Commands Reference

```bash
# Setup
npx prisma migrate reset --force      # Reset & seed everything

# Development
npm run dev                           # Start dev server

# Inspection
npx prisma studio                     # View database GUI
npm run build                         # Check production build

# Database
npx prisma db seed                    # Just run seed
npx prisma migrate dev                # Create new migration
npx prisma generate                   # Regenerate Prisma Client
```

## 📈 System Health Indicators

```
✅ Build Status: SUCCESS
✅ Seed Status: COMPLETE (4 depts, 4 heads created)
✅ Database Migration: APPLIED
✅ API Endpoints: FUNCTIONAL
✅ Frontend Integration: COMPLETE
✅ TypeScript Validation: PASSED
✅ Type Safety: FULL
✅ Error Handling: IMPLEMENTED
✅ Documentation: COMPREHENSIVE
✅ Production Ready: YES
```

---

**Last Updated**: Latest seed integration complete  
**Status**: 🟢 Ready for testing and production deployment
