import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ departmentId: string }> }
) {
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

    const { departmentId } = await params

    if (!departmentId) {
      return NextResponse.json(
        { error: 'Department ID is required' },
        { status: 400 }
      )
    }

    // Get all members of the department
    const members = await prisma.user.findMany({
      where: {
        departmentId: departmentId,
        userRole: {
          in: ['DEPARTMENT_HEAD', 'REGULAR_USER']
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        userRole: true,
        departmentId: true
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(members)
  } catch (error) {
    console.error('Error fetching department members:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
