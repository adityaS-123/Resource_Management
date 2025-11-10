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

    // Check if user is IT team member or admin
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, userRole: true }
    })

    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.userRole !== 'IT_TEAM' && currentUser.userRole !== 'IT_HEAD')) {
      console.log('Access denied for user:', session.user.id, 'role:', currentUser?.userRole)
      return NextResponse.json({ error: 'Access denied. IT team access required.' }, { status: 403 })
    }

    // Get the Operations department
    const operationsDept = await prisma.department.findUnique({
      where: { name: 'Operations' },
      include: {
        members: {
          where: {
            userRole: {
              in: ['DEPARTMENT_HEAD', 'REGULAR_USER']
            }
          },
          select: {
            id: true,
            name: true,
            email: true,
            userRole: true
          },
          orderBy: { name: 'asc' }
        }
      }
    })

    console.log('Operations dept found:', operationsDept?.name, 'members:', operationsDept?.members?.length)

    if (!operationsDept) {
      console.log('Operations department not found')
      return NextResponse.json(
        { error: 'Operations department not found' },
        { status: 404 }
      )
    }

    const response = {
      department: {
        id: operationsDept.id,
        name: operationsDept.name,
        description: operationsDept.description
      },
      members: operationsDept.members
    }

    console.log('Returning members response:', response)
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching Operations department members:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}

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

    // Get the resource request with current data
    const resourceRequest = await prisma.resourceRequest.findUnique({
      where: { id: requestId }
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
      select: { id: true, name: true, email: true, departmentId: true, userRole: true, department: { select: { id: true, name: true } } }
    })

    if (!assignedToUser) {
      return NextResponse.json({ error: 'Assigned user not found' }, { status: 404 })
    }

    // Verify the user belongs to Operations department
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

    // Verify user belongs to Operations department
    if (assignedToUser.department?.name !== 'Operations') {
      return NextResponse.json(
        { error: 'Can only assign tasks to Operations department members' },
        { status: 400 }
      )
    }

    // Update the request with assignment info
    const updatedRequest = await prisma.resourceRequest.update({
      where: { id: requestId },
      data: {
        assignedToUserId: assignedToUserId,
        assignedAt: new Date()
      }
    })

    return NextResponse.json({
      message: 'Task assigned successfully',
      request: {
        id: updatedRequest.id,
        status: updatedRequest.status,
        assignedToUserId: updatedRequest.assignedToUserId,
        assignedAt: updatedRequest.assignedAt,
        assignedToUser: {
          id: assignedToUser.id,
          name: assignedToUser.name,
          email: assignedToUser.email,
          department: assignedToUser.department
        }
      }
    })
  } catch (error) {
    console.error('Error assigning task:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
