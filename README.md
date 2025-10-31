# Resource Management System

A full-stack web application built with Next.js 15, TypeScript, PostgreSQL, and Prisma ORM that allows admins to create and manage projects with resource and time details across project phases, while enabling users to request resource allocations within defined limits.

## Features

### Admin Features
- **Project Management**: Create, edit, and delete projects with client details, timelines, and cost information
- **Phase Management**: Define project phases (Development, Testing, Production) with allocated costs and durations
- **Resource Configuration**: Set up resource types (VM, Storage, Network) with specifications and limits
- **Request Approval**: View and approve/reject resource requests from users
- **Analytics Dashboard**: View total costs, profit margins, and usage analytics
- **User Management**: Assign users to projects and manage access

### User Features
- **Project Access**: View assigned projects and available resource limits
- **Resource Requests**: Submit requests for VMs, storage, and other resources with specifications
- **Request Tracking**: Monitor request status (Pending, Approved, Rejected)
- **Dashboard**: View personal project assignments and request history

### System Features
- **Role-based Authentication**: Admin and User roles with appropriate access controls
- **Resource Limit Enforcement**: Prevents requests exceeding allocated limits
- **Audit Trail**: Track all approvals, rejections, and changes
- **Profit Margin Protection**: Controls unauthorized resource demands to maintain profitability

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Next.js API routes with Prisma ORM
- **Database**: SQLite (development) / PostgreSQL (production)
- **Authentication**: NextAuth.js with JWT sessions
- **UI Components**: shadcn/ui component library

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone and setup the project**:
```bash
cd bid-management
npm install
```

2. **Environment Configuration**:
The project is already configured with SQLite for local development. The `.env` file contains:
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="bid-management-secret-key-2024"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
```

3. **Database Setup**:
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Seed the database with test data
npx tsx prisma/seed.ts
```

4. **Start the development server**:
```bash
npm run dev
```

5. **Access the application**:
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Test Accounts

After seeding the database, you can use these test accounts:

**Admin Account**:
- Email: `admin@example.com`
- Password: `admin123`
- Access: Full admin dashboard, project management, request approvals

**User Accounts**:
- Email: `john@example.com` / Password: `user123`
- Email: `jane@example.com` / Password: `user123`
- Access: User dashboard, project viewing, resource requests

## Database Schema

The system uses the following main models:

- **User**: Stores user information and roles
- **Project**: Project details with client info, dates, and costs
- **Phase**: Project phases with duration and allocated costs
- **Resource**: Available resources per phase with specifications
- **ResourceRequest**: User requests for resources with approval status

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/[...nextauth]` - NextAuth.js endpoints

### Projects (Admin only)
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/[id]` - Get project details
- `PUT /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project

### Phases (Admin only)
- `POST /api/projects/[id]/phases` - Add phase to project
- `POST /api/phases/[id]/resources` - Add resource to phase

### Resource Requests
- `GET /api/requests` - List requests (filtered by user role)
- `POST /api/requests` - Create new request
- `POST /api/requests/[id]/approve` - Approve/reject request (Admin only)

## Page Structure

### Admin Pages
- `/admin/dashboard` - Overview with stats and recent requests
- `/admin/projects` - Project listing and management
- `/admin/projects/new` - Create new project
- `/admin/projects/[id]` - Project details with phases and resources
- `/admin/requests` - All resource requests with approval actions

### User Pages
- `/dashboard` - User dashboard with assigned projects
- `/user/requests` - Personal resource requests
- `/user/requests/new` - Submit new resource request

### Authentication
- `/login` - Login and registration page

## Business Rules

1. **Resource Limits**: Users can only request resources within the limits defined for each phase
2. **Project Access**: Users can only access projects they are assigned to
3. **Approval Process**: All resource requests require admin approval
4. **Cost Tracking**: System tracks allocated vs actual resource usage
5. **Profit Margin Protection**: Prevents unauthorized resource demands that could erode profits

## Development

### Adding New Features

1. **Database Changes**: Update `prisma/schema.prisma` and run migrations
2. **API Routes**: Add new endpoints in `/app/api/`
3. **UI Components**: Create components in `/components/`
4. **Pages**: Add new pages in `/app/`

### Database Management

```bash
# View database in Prisma Studio
npx prisma studio

# Reset database and reseed
npx prisma migrate reset
npx tsx prisma/seed.ts

# Deploy database changes
npx prisma db push
```

## Deployment

### Production Setup

1. **Database**: Set up PostgreSQL database
2. **Environment**: Update `DATABASE_URL` in production environment
3. **Authentication**: Generate secure `NEXTAUTH_SECRET`
4. **Deploy**: Deploy to Vercel, AWS, or preferred platform

### Environment Variables

```env
DATABASE_URL="postgresql://user:password@host:port/database"
NEXTAUTH_SECRET="your-production-secret"
NEXTAUTH_URL="https://your-domain.com"
NODE_ENV="production"
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions or issues, please refer to the project documentation or create an issue in the repository.
