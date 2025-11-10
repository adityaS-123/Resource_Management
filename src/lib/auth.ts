import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          userRole: user.userRole,
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.userRole = user.userRole || undefined
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.userRole = token.userRole
      }
      return session
    },
    async signIn({ user, account, profile }) {
      // Process pending invitations when user signs in
      if (user?.email) {
        try {
          // Find pending invitations for this user's email
          const pendingInvitations = await prisma.projectInvitation.findMany({
            where: {
              email: user.email,
              status: 'PENDING'
            }
          })

          if (pendingInvitations.length > 0) {
            // Add user to all projects they were invited to
            const projectIds = pendingInvitations.map(inv => inv.projectId)
            
            for (const projectId of projectIds) {
              // Add user to project
              await prisma.project.update({
                where: { id: projectId },
                data: {
                  users: {
                    connect: { id: user.id }
                  }
                }
              })
            }

            // Mark invitations as accepted
            await prisma.projectInvitation.updateMany({
              where: {
                email: user.email,
                status: 'PENDING'
              },
              data: {
                status: 'ACCEPTED'
              }
            })

            console.log(`Automatically accepted ${pendingInvitations.length} project invitations for ${user.email}`)
          }
        } catch (error) {
          console.error('Error processing invitations during signin:', error)
          // Don't block signin if invitation processing fails
        }
      }
      
      return true
    }
  },
  pages: {
    signIn: '/login',
  }
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: string
      userRole?: string | null
    }
  }

  interface User {
    role: string
    userRole?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string
    userRole?: string
  }
}