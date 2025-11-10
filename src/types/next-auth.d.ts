import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: string
      userRole?: string
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    role: string
    userRole?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string
    userRole?: string
  }
}