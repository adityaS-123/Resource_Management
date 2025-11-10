import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    // Add any middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Check if user is trying to access admin routes
        if (req.nextUrl.pathname.startsWith('/admin')) {
          return token?.role === 'ADMIN' || 
                 token?.userRole === 'ADMIN' || 
                 token?.userRole === 'DEPARTMENT_HEAD' || 
                 token?.userRole === 'IT_HEAD' ||
                 token?.userRole === 'IT_TEAM'
        }
        
        // Check if user is trying to access protected routes
        if (req.nextUrl.pathname.startsWith('/dashboard')) {
          return !!token
        }

        return true
      },
    },
  }
)

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*']
}