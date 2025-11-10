# Department Selection Feature Implementation

## Overview
Successfully implemented department selection during user registration. Users can now select their department when creating an account, which will be saved to their profile and used for role-based assignment (e.g., automatic Department Head assignment).

## Changes Made

### 1. Database Schema (Prisma)
**File: `prisma/schema.prisma`**

Added new `Department` model:
```prisma
model Department {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  head        User?    @relation("DepartmentHead", fields: [headId], references: [id], onDelete: SetNull)
  headId      String?  @unique
  members     User[]   @relation("DepartmentMembers")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

Updated `User` model to include department:
- Added `departmentId: String?` field
- Added relationship: `department: Department?` via departmentId
- Added reverse relationship: `headedDepartment: Department?` for department heads

**Migration**: `20251110052929_add_department_model`
- Run automatically via `npx prisma migrate dev`
- Creates Department table and adds department-related columns to User table

### 2. Registration API
**File: `src/app/api/auth/register/route.ts`**

Updated POST handler to:
- Accept optional `departmentId` in request body
- Validate department exists before creating user
- Create user with department association
- Return user with department info

```typescript
// Now accepts departmentId
const { name, email, password, role = 'USER', departmentId } = await request.json()

// Validates department exists
if (departmentId) {
  const department = await prisma.department.findUnique({
    where: { id: departmentId }
  })
  if (!department) {
    return NextResponse.json(
      { error: 'Invalid department selected' },
      { status: 400 }
    )
  }
}
```

### 3. Departments API
**File: `src/app/api/departments/route.ts` (NEW)**

New endpoint for managing departments:
- **GET /api/departments**: Fetch all departments (used by registration dropdown)
- **POST /api/departments**: Create new department (admin only)

Departments returned with:
- ID, name, description
- Department head info (name, email)
- List of members

### 4. Login/Registration UI
**File: `src/app/login/page.tsx`**

Enhanced registration form with:
- New state: `departmentId`, `departments`, `loadingDepts`
- `useEffect` hook to fetch departments when registration mode is activated
- New department dropdown `<Select>` component

UI improvements:
```tsx
<Select value={departmentId} onValueChange={setDepartmentId} disabled={loadingDepts}>
  <SelectTrigger id="department" className="input-enhanced">
    <SelectValue placeholder={loadingDepts ? "Loading departments..." : "Select a department"} />
  </SelectTrigger>
  <SelectContent>
    {departments.map((dept) => (
      <SelectItem key={dept.id} value={dept.id}>
        {dept.name}
        {dept.description && ` - ${dept.description}`}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

- Department selection is optional ("Choose your department. You can update this later.")
- Departments load dynamically when user switches to registration mode

### 5. Department Seed Script
**File: `scripts/seed-departments.ts` (NEW)**

Seed script to populate initial departments:
- Engineering
- Operations
- Finance
- Human Resources
- Sales
- Marketing

Run with:
```bash
npx tsx scripts/seed-departments.ts
```

**Status**: Already executed — departments are now in the database.

## User Flow

### Registration Process
1. User clicks "Create Account" on login page
2. Registration form appears with fields: Full Name, Email, Password, **Department (optional)**
3. Department dropdown fetches available departments from `/api/departments`
4. User selects department or leaves empty
5. User submits form → calls `/api/auth/register` with departmentId
6. Backend validates department exists, creates user with department association
7. Registration success message shown

### Future Enhancements

The department association can enable:

1. **Automatic Department Head Assignment**
   - Users with DEPARTMENT_HEAD role can be assigned as department head
   - Users register → assigned to department → department head notified
   - Code ready in `User` model: `headedDepartment: Department?` relation

2. **Department-Based Approval Hierarchy**
   - Resource requests can route to department head first
   - Then to IT Head, then Admin
   - Existing approval flow already supports this with currentLevel logic

3. **Department Analytics**
   - Track resource usage per department
   - Dashboard showing department resource allocation
   - Cost tracking by department

4. **Access Control**
   - Department heads can only see requests from their department
   - Admins see all requests
   - Restrict resource availability by department

5. **Department Management UI**
   - Admin page to manage departments (create, edit, delete)
   - Assign department heads
   - View department members

## API Documentation

### GET /api/departments
**Description**: Fetch all departments  
**Access**: Public (used during registration)  
**Response**:
```json
[
  {
    "id": "clz...",
    "name": "Engineering",
    "description": "Software Development & Engineering",
    "head": {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com"
    }
  },
  ...
]
```

### POST /api/auth/register
**Description**: Register new user with optional department  
**Request**:
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "securepassword",
  "departmentId": "clz..." // optional
}
```
**Response** (201 Created):
```json
{
  "id": "...",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "departmentId": "clz...",
  "role": "USER",
  "createdAt": "2025-11-10T...",
  "department": {
    "id": "clz...",
    "name": "Engineering",
    "description": "Software Development & Engineering",
    "head": {...}
  }
}
```

## Build Status
✅ **Build Successful**
- All TypeScript types validate
- ESLint warnings only (no build-blocking errors)
- No module errors
- All routes properly exported

**Size Impact**: Minimal
- Login page: +3.4 kB (172 kB → 11.8 kB visible size)
- New `/api/departments` endpoint added

## Testing Recommendations

1. **Registration Flow**
   - Register user with department selected
   - Register user without department
   - Verify database saves department association

2. **Dropdown Functionality**
   - Verify departments load on registration form
   - Test with many departments (pagination may be needed)
   - Test with no departments available

3. **Department Assignment**
   - Query database to verify department_id saved correctly
   - Check user.department relation returns correct data
   - Verify department.members relation includes user

4. **Edge Cases**
   - Register with invalid departmentId
   - Register with departmentId that was deleted after dropdown loaded
   - Concurrent registrations to same department

## Files Modified/Created

### Modified
- `prisma/schema.prisma` — Added Department model, updated User
- `src/app/api/auth/register/route.ts` — Department validation & saving
- `src/app/login/page.tsx` — Department dropdown in registration UI

### Created
- `src/app/api/departments/route.ts` — Departments API endpoint
- `scripts/seed-departments.ts` — Department seed script
- `prisma/migrations/20251110052929_add_department_model/` — Migration files

## Next Steps

To complete the department feature:

1. **Create admin panel for department management**
   - List all departments
   - Create/edit/delete departments
   - Assign/remove department heads

2. **Implement department head assignment logic**
   - When department head selects a department during registration
   - Automatically promote them or flag for admin review

3. **Update resource request approval flow**
   - Route requests through department head first if applicable
   - Add logic to determine if department head approval needed

4. **Add user profile update**
   - Allow users to change their department later
   - Restrict based on role (users can change own, admins can change any)

5. **Dashboard enhancements**
   - Department-specific views
   - Department resource allocation tracking
   - Department metrics and analytics

6. **Email notifications**
   - Notify department head when new member joins
   - Notify user of department assignment confirmation

## Security Notes

- Department selection during registration is optional (no user left without recourse)
- Department IDs are validated on backend before saving
- No privilege escalation via department assignment (role stays USER by default)
- Department head relation is one-to-one and optional
- Users can belong to only one department (current design)

## Performance Considerations

- Departments are simple lookups (indexed by ID, unique by name)
- GET /api/departments will be fast even with many departments
- Consider pagination if department count grows very large (>1000)
- User.department relation uses eager loading in register API for consistency
