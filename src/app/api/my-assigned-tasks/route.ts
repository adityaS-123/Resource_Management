import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get tasks assigned to this user
    const assignedTasks = await prisma.resourceRequest.findMany({
      where: {
        assignedToUserId: session.user.id,
        status: 'ASSIGNED_TO_IT'
      },
      include: {
        user: {
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
          select: { id: true, name: true, description: true }
        },
        approvals: {
          where: { status: 'APPROVED' },
          include: {
            approver: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { approvalLevel: 'asc' }
        }
      },
      orderBy: { assignedAt: 'desc' }
    })

    return NextResponse.json(assignedTasks)
  } catch (error) {
    console.error('Error fetching assigned tasks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { requestId, completionNotes, credentials } = await request.json()

    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      )
    }

    // Get the resource request
    const resourceRequest = await prisma.resourceRequest.findUnique({
      where: { id: requestId }
    })

    if (!resourceRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // Verify the task is assigned to this user
    if (resourceRequest.assignedToUserId !== session.user.id) {
      return NextResponse.json({ error: 'This task is not assigned to you' }, { status: 403 })
    }

    // Verify the task is in ASSIGNED_TO_IT status
    if (resourceRequest.status !== 'ASSIGNED_TO_IT') {
      return NextResponse.json(
        { error: 'Task must be in ASSIGNED_TO_IT status' },
        { status: 400 }
      )
    }

    // Mark task as complete
    const updatedRequest = await prisma.resourceRequest.update({
      where: { id: requestId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        completedById: session.user.id,
        completionNotes: completionNotes || null,
        credentials: credentials ? JSON.stringify(credentials) : null
      },
      include: {
        user: {
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
          select: { id: true, name: true }
        },
        completedBy: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json({
      message: 'Task completed successfully',
      request: updatedRequest
    })
  } catch (error) {
    console.error('Error completing task:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
