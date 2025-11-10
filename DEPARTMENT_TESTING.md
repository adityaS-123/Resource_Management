# Quick Start: Testing Department Selection Feature

## What Changed?
Users registering for the app can now select their department during signup. This prepares the system for department-based access control and approval routing.

## How to Test

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Navigate to Login Page
Open `http://localhost:3000/login` in your browser

### 3. Switch to Registration Mode
Click: **"Don't have an account? Create one now"**

### 4. You Should See
- **Full Name** field
- **Department** dropdown (with options: Engineering, Operations, Finance, Human Resources, Sales, Marketing)
- **Email** field
- **Password** field

### 5. Test Scenarios

**Scenario A: Register with Department**
- Fill: Name = "Alice Johnson"
- Select: Department = "Engineering"
- Fill: Email = "alice@example.com"
- Fill: Password = "TestPass123"
- Click: "Create Account"
- Expected: Success message, user created with Engineering department

**Scenario B: Register without Department**
- Fill: Name = "Bob Smith"
- Leave: Department = empty (optional)
- Fill: Email = "bob@example.com"
- Fill: Password = "TestPass123"
- Click: "Create Account"
- Expected: Success message, user created without department

**Scenario C: Invalid Department**
- (Advanced) Modify request to include fake departmentId
- Expected: "Invalid department selected" error

## Database Verification

### Check Departments
```bash
npx prisma studio
```
Then navigate to the `Department` table to see all departments.

### Check User Department
In Prisma Studio:
1. Go to `User` table
2. Open a user record
3. Look at `departmentId` field (should show selected department or null)

### Query Example
```bash
npx prisma client
```

```typescript
// Find all users in Engineering department
const engineeringUsers = await prisma.user.findMany({
  where: {
    department: {
      name: "Engineering"
    }
  },
  include: { department: true }
})
```

## Files to Review

### Frontend (User sees this)
- `src/app/login/page.tsx` — Registration form with department dropdown

### Backend (Server processes this)
- `src/app/api/auth/register/route.ts` — Validates and saves department
- `src/app/api/departments/route.ts` — Provides department list

### Database
- `prisma/schema.prisma` — Department and User models
- `prisma/migrations/20251110052929_add_department_model/` — Migration

### Seed Data
- `scripts/seed-departments.ts` — Departments (already seeded)

## Available Departments

Currently seeded into database:
1. **Engineering** - Software Development & Engineering
2. **Operations** - Operations and Infrastructure
3. **Finance** - Finance and Accounting
4. **Human Resources** - Human Resources and Administration
5. **Sales** - Sales and Business Development
6. **Marketing** - Marketing and Communications

## Common Issues & Troubleshooting

### Dropdown Not Showing
**Problem**: Department dropdown appears empty during registration  
**Solution**: 
- Verify migration ran: `npx prisma migrate status`
- Verify seed script ran: `npx tsx scripts/seed-departments.ts`
- Check browser console for errors

### "Invalid Department Selected" Error
**Problem**: Getting error when submitting with a department  
**Solution**:
- Refresh page to reload departments
- Ensure selected department ID is valid
- Check database: `npx prisma studio` → Department table

### User Created But No Department
**Problem**: User registered but department not saved  
**Solution**:
- Verify department was selected (not left empty)
- Check form submission: open browser DevTools → Network tab
- Verify API response includes departmentId

## Next Steps After Testing

Once you confirm the feature works:

1. **Add Department Management UI** (optional now)
   - Admin page to create/edit/delete departments
   - Admin page to assign department heads

2. **Implement Department Head Logic** (optional now)
   - Users with DEPARTMENT_HEAD role assigned to departments
   - Auto-routing requests to department head for approval

3. **Add Department Filtering** (optional now)
   - Department heads can filter requests from their team
   - Dashboards show department-specific metrics

## API Endpoints

### Get All Departments (Used by dropdown)
```bash
curl http://localhost:3000/api/departments
```

### Register with Department
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "password": "TestPass123",
    "departmentId": "DEPARTMENT_ID_HERE"
  }'
```

## Build Status
✅ Build successful - no errors or blocking issues
```
npm run build
# Expected output: "✓ Linting and checking validity of types"
```

## Rollback (if needed)

To undo department feature:
```bash
npx prisma migrate resolve --rolled-back add_department_model
```

This will:
- Remove the migration
- Recreate database schema without Department table
- Users will still have their data (departmentId field will be empty)

---

**Questions?** Check `DEPARTMENT_FEATURE.md` for detailed documentation.
