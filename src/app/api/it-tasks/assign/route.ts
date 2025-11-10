import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
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

    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.userRole !== 'IT_TEAM' && currentUser.userRole !== 'IT_HEAD')) {
      return NextResponse.json({ error: 'Access denied. IT team access required.' }, { status: 403 })
    }

    const { requestId, assignedToUserId } = await request.json()

    if (!requestId || !assignedToUserId) {
      return NextResponse.json(
        { error: 'Request ID and assigned user ID are required' },
        { status: 400 }
      )
    }

    // Get the resource request
    const resourceRequest = await prisma.resourceRequest.findUnique({
      where: { id: requestId },
      include: {
        user: true,
        phase: {
          include: {
            project: true
          }
        },
        resourceTemplate: true
      }
    })

    if (!resourceRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // Verify the request is assigned to IT
    if (resourceRequest.status !== 'ASSIGNED_TO_IT') {
      return NextResponse.json(
        { error: 'Request must be in ASSIGNED_TO_IT status to assign to department members' },
        { status: 400 }
      )
    }

    // Get the user to assign the task to
    const assignedToUser = await prisma.user.findUnique({
      where: { id: assignedToUserId },
      select: { id: true, name: true, email: true, departmentId: true, userRole: true }
    })

    if (!assignedToUser) {
      return NextResponse.json({ error: 'Assigned user not found' }, { status: 404 })
    }

    // Verify the user belongs to a department (is not IT team/admin)
    if (!assignedToUser.departmentId) {
      return NextResponse.json(
        { error: 'Can only assign tasks to department members' },
        { status: 400 }
      )
    }

    if (assignedToUser.userRole === 'IT_TEAM' || assignedToUser.userRole === 'IT_HEAD' || assignedToUser.userRole === 'ADMIN') {
      return NextResponse.json(
        { error: 'Cannot assign tasks to IT team members' },
        { status: 400 }
      )
    }

    // Assign the task to the user
    const updatedRequest = await prisma.resourceRequest.update({
      where: { id: requestId },
      data: {
        assignedToUserId: assignedToUserId,
        assignedAt: new Date(),
        status: 'ASSIGNED_TO_IT' // Keep status as ASSIGNED_TO_IT until they complete it
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        assignedToUser: {
          select: { id: true, name: true, email: true, department: { select: { id: true, name: true } } }
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
        }
      }
    })

    return NextResponse.json(updatedRequest)
  } catch (error) {
    console.error('Error assigning task:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
