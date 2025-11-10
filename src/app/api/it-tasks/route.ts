import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is IT team member or admin
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, userRole: true }
    })

    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.userRole !== 'IT_TEAM')) {
      return NextResponse.json({ error: 'Access denied. IT team access required.' }, { status: 403 })
    }

    // Get all requests that are assigned to IT or completed
    const itTasks = await prisma.resourceRequest.findMany({
      where: {
        OR: [
          { status: 'ASSIGNED_TO_IT' },
          { status: 'COMPLETED' }
        ]
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        assignedToUser: {
          select: { id: true, name: true, email: true }
        },
        phase: {
          include: {
            project: {
              select: { id: true, name: true, client: true }
            }
          }
        },
        resourceTemplate: {
          select: { 
            id: true, 
            name: true, 
            description: true
          }
        },
        approvals: {
          where: { status: 'APPROVED' },
          include: {
            approver: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { approvalLevel: 'asc' }
        },
        completedBy: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: [
        { status: 'asc' }, // ASSIGNED_TO_IT first, then COMPLETED
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(itTasks)
  } catch (error) {
    console.error('Error fetching IT tasks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}