# Integrated Seed Setup Documentation

## Overview

The database seed script (`prisma/seed.ts`) has been updated to automatically create departments and department heads during database initialization. This provides a complete, out-of-the-box setup for department-based resource request management.

## What Gets Created

### Departments (4 Total)

1. **Engineering**
   - Head: Alice Johnson (alice.johnson@example.com)
   - Description: Software engineering and development team

2. **Operations**
   - Head: Bob Smith (bob.smith@example.com)
   - Description: IT operations and infrastructure team

3. **Finance**
   - Head: Carol White (carol.white@example.com)
   - Description: Financial planning and budgeting team

4. **Human Resources**
   - Head: Diana Brown (diana.brown@example.com)
   - Description: HR and employee management team

### Department Head Accounts

All department heads are created with:
- **Role**: USER
- **User Role**: DEPARTMENT_HEAD
- **Password**: DeptHead@123
- **Auto-assigned** to their respective department

| Name | Email | Department | Password |
|------|-------|-----------|----------|
| Alice Johnson | alice.johnson@example.com | Engineering | DeptHead@123 |
| Bob Smith | bob.smith@example.com | Operations | DeptHead@123 |
| Carol White | carol.white@example.com | Finance | DeptHead@123 |
| Diana Brown | diana.brown@example.com | Human Resources | DeptHead@123 |

### Legacy Support

- **Legacy Dept Head**: dept.head@example.com / dept123 (assigned to Engineering)
- **IT Head**: it.head@example.com / ithead123 (IT_HEAD role, no department)
- **Admin**: admin@example.com / admin123 (ADMIN role)
- **IT Team**: it.support@example.com, it.ops@example.com / it123

### Regular Users

| Name | Email | Department | Password |
|------|-------|-----------|----------|
| John Developer | john@example.com | - | user123 |
| Jane Designer | jane@example.com | - | user123 |
| Mike Tester | mike@example.com | - | user123 |

## Running the Seed

### Initial Setup (Fresh Database)

```bash
npx prisma db seed
```

### Reset Database with New Seed

If the database already exists and you want to start fresh:

```bash
npx prisma migrate reset --force
```

This will:
1. Drop the existing database
2. Run all migrations
3. Execute the seed script

## Test Scenarios

### Scenario 1: New User Registration with Department

1. Navigate to `/login`
2. Click "Create new account"
3. Fill in credentials:
   - Email: test.user@example.com
   - Name: Test User
   - Department: Select "Engineering"
   - Password: test123
4. Submit registration
5. Login with credentials
6. Verify department assignment in profile

### Scenario 2: Department Head Approval Workflow

1. Login as a department head:
   - Email: alice.johnson@example.com (Engineering)
   - Password: DeptHead@123
2. Navigate to dashboard/requests
3. View pending resource requests from department members
4. Approve/reject requests

### Scenario 3: Cross-Department Approvals

1. Login as Admin: admin@example.com / admin123
2. View all resource requests across departments
3. Perform multi-level approvals if needed

## Database Schema

### Department Model

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

### User Department Relations

```prisma
model User {
  // ... other fields
  department     Department? @relation("DepartmentMembers", fields: [departmentId], references: [id], onDelete: SetNull)
  departmentId   String?
  headedDepartment Department? @relation("DepartmentHead")
}
```

## API Integration

### Get Departments Dropdown (for Registration)

```bash
GET /api/departments
```

Response:
```json
[
  {
    "id": "cuid1",
    "name": "Engineering",
    "description": "Software engineering and development team",
    "head": {
      "id": "userid1",
      "name": "Alice Johnson",
      "email": "alice.johnson@example.com"
    }
  },
  // ... more departments
]
```

### Register with Department

```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "User Name",
  "password": "password123",
  "departmentId": "cuid1"
}
```

## Accessing Database via Prisma Studio

To visually inspect and manage the database:

```bash
npx prisma studio
```

This opens a web UI at `http://localhost:5555` where you can:
- View all departments and their members
- Edit department head assignments
- Create/delete departments
- View user department relationships

## Key Features

✅ **Automatic Department Creation** - No manual SQL needed  
✅ **Pre-assigned Department Heads** - Ready for approval workflows  
✅ **Department Relationships** - Users linked to departments automatically  
✅ **Idempotent Operations** - Safe to run seed multiple times (uses upsert)  
✅ **Sample Resource Templates** - Pre-configured approval levels  
✅ **Sample Resource Requests** - Different approval workflow stages  
✅ **Backward Compatible** - Existing data preserved when running seed  

## Future Enhancements

1. **Department Management UI** - Admin panel to create/edit/delete departments
2. **Department Head Assignment** - Assign/remove department heads through UI
3. **Department Filtering** - Filter requests, users by department
4. **Department Analytics** - Budget tracking per department
5. **Department Transfer Workflow** - Move users between departments
6. **Auto Department Assignment** - Assign users based on email domain patterns

## Troubleshooting

### Issue: Departments not created

**Solution:**
```bash
npx prisma migrate reset --force
```

### Issue: Can't login as department head

**Solution:** Check credentials:
- Email: alice.johnson@example.com
- Password: DeptHead@123
- Verify department head was created: Check Prisma Studio `/admin/departments`

### Issue: Department dropdown empty during registration

**Solution:** 
1. Verify seed ran: Check database for departments
2. Check `/api/departments` endpoint returns data
3. Verify network request in browser DevTools

## Performance Notes

The seed script is optimized with:
- **upsert** operations to prevent duplicate errors
- **Promise.all()** for parallel department creation
- Single department head creation per department
- Efficient resource template upsert patterns

Typical seed execution time: **< 2 seconds**

## Security Notes

⚠️ **Default Passwords for Demo Only**

The seed script uses default credentials for easy testing. In production:

1. Use strong, unique passwords
2. Remove demo accounts
3. Implement environment-based seed logic
4. Use secure password generation
5. Restrict admin account creation

```typescript
// Production-safe approach
const deptHeadPassword = process.env.DEPT_HEAD_PASSWORD || await bcrypt.hash('DeptHead@123', 12)
```

## Related Documentation

- [Department Feature](./DEPARTMENT_FEATURE.md)
- [Department Testing Guide](./DEPARTMENT_TESTING.md)
- [Prisma Schema](./prisma/schema.prisma)
- [Seed Script](./prisma/seed.ts)
