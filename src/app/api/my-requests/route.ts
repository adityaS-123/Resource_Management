import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the user's resource requests
    const requests = await prisma.resourceRequest.findMany({
      where: {
        user: {
          email: session.user.email
        }
      },
      include: {
        resourceTemplate: {
          select: {
            id: true,
            name: true,
            description: true,
            approvalLevels: true
          }
        },
        phase: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                client: true
              }
            }
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        },
        approvals: {
          include: {
            approver: {
              select: {
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            approvalLevel: 'asc'
          }
        },
        completedBy: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Parse the requestedConfig JSON field
    const formattedRequests = requests.map(request => ({
      ...request,
      requestedConfig: request.requestedConfig ? JSON.parse(request.requestedConfig) : {}
    }))

    return NextResponse.json(formattedRequests)
  } catch (error) {
    console.error('Error fetching user requests:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}