# Quick Start Guide - Department Feature

## 🚀 Getting Started

### Fresh Database Setup

```bash
# Reset database and seed everything
npx prisma migrate reset --force
```

This creates:
- ✅ 4 departments
- ✅ 4 department heads
- ✅ Sample users
- ✅ Resource templates
- ✅ Sample requests

### Start the Application

```bash
npm run dev
```

Visit: `http://localhost:3000`

## 👤 Test Accounts

### Admin
- **Email**: admin@example.com
- **Password**: admin123
- **Access**: All features, all departments

### Department Heads (All use password: `DeptHead@123`)

| Department | Email | Password |
|-----------|-------|----------|
| Engineering | alice.johnson@example.com | DeptHead@123 |
| Operations | bob.smith@example.com | DeptHead@123 |
| Finance | carol.white@example.com | DeptHead@123 |
| HR | diana.brown@example.com | DeptHead@123 |

### Regular Users (All use password: `user123`)

- john@example.com
- jane@example.com
- mike@example.com

## 🧪 Quick Tests

### Test 1: Register New User with Department

1. Go to `/login`
2. Click "Create new account"
3. Enter:
   - Email: `newuser@example.com`
   - Name: `New User`
   - Select Department: `Engineering`
   - Password: `test123`
4. Click Register
5. Login with new credentials
6. Check profile - should show department

### Test 2: Department Head Approval

1. Login as: alice.johnson@example.com / DeptHead@123
2. Go to Admin → Requests
3. See pending requests from engineering department
4. Approve/Reject test requests

### Test 3: Check Database

```bash
npx prisma studio
```

Opens: `http://localhost:5555`
- Navigate to "Department" table
- View departments with heads
- View users with their department assignments

## 📊 API Endpoints

### Get All Departments (for registration dropdown)
```bash
curl http://localhost:3000/api/departments
```

### Register User with Department
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "User Name",
    "password": "password123",
    "departmentId": "dept-id-here"
  }'
```

## 📁 Key Files

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Database schema with Department model |
| `prisma/seed.ts` | Seed script (creates departments & heads) |
| `src/app/login/page.tsx` | Registration with department dropdown |
| `src/app/api/auth/register/route.ts` | Register endpoint |
| `src/app/api/departments/route.ts` | Departments endpoint |

## 🔧 Common Tasks

### Reset Everything
```bash
npx prisma migrate reset --force
```

### Update Seed (e.g., add more departments)
```bash
# Edit prisma/seed.ts
# Then run:
npx prisma migrate reset --force
```

### View Prisma Logs
```bash
npm run dev
# Look for Prisma query logs in terminal
```

### Check Build
```bash
npm run build
```

## 🐛 Debugging

### Can't login?
- Check email spelling (case-sensitive)
- Verify password (see above)
- Run seed again: `npx prisma migrate reset --force`

### Department not showing?
- Check Prisma Studio: `npx prisma studio`
- Verify department creation in database
- Restart dev server: `npm run dev`

### API returning empty departments?
```bash
curl http://localhost:3000/api/departments
```
Should return array with 4 departments

## 📚 Documentation Files

- **INTEGRATED_SEED_SETUP.md** - Complete setup details
- **DEPARTMENT_FEATURE.md** - Full feature documentation
- **DEPARTMENT_TESTING.md** - Comprehensive testing guide

## 🎯 Next Steps

1. ✅ Seed database: `npx prisma migrate reset --force`
2. ✅ Start app: `npm run dev`
3. ✅ Test registration with department selection
4. ✅ Login as department head to test approval workflow
5. ✅ Implement department-based request filtering (optional)

---

**Need help?** Check the documentation files or API logs in terminal!
