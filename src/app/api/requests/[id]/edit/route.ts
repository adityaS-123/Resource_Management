import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()

    // Fetch the request
    const resourceRequest = await prisma.resourceRequest.findUnique({
      where: { id },
      include: { approvals: true }
    })

    if (!resourceRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    // Check if user is the requester
    if (resourceRequest.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only edit your own requests' },
        { status: 403 }
      )
    }

    // Check if request can be edited (only before level 1 approval)
    // A request can be edited if:
    // 1. Status is PENDING (not started approval)
    // 2. Status is IN_PROGRESS but currentLevel is 0 (no approvals yet)
    if (resourceRequest.status === 'REJECTED' || resourceRequest.status === 'APPROVED' || 
        resourceRequest.status === 'ASSIGNED_TO_IT' || resourceRequest.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Cannot edit requests that have been approved, rejected, or completed' },
        { status: 400 }
      )
    }

    // If status is IN_PROGRESS, check if any level 1 approvals exist
    if (resourceRequest.status === 'IN_PROGRESS') {
      const level1Approval = resourceRequest.approvals.find(a => a.approvalLevel === 1)
      if (level1Approval && level1Approval.status === 'APPROVED') {
        return NextResponse.json(
          { error: 'Cannot edit requests that have been approved at level 1 or higher' },
          { status: 400 }
        )
      }
    }

    // Update the request
    const updatedRequest = await prisma.resourceRequest.update({
      where: { id },
      data: {
        requestedConfig: body.requestedConfig ? JSON.stringify(body.requestedConfig) : resourceRequest.requestedConfig,
        requestedQty: body.requestedQty ?? resourceRequest.requestedQty,
        justification: body.justification ?? resourceRequest.justification,
        updatedAt: new Date()
      },
      include: {
        resourceTemplate: true,
        phase: {
          include: {
            project: true
          }
        },
        approvals: {
          include: {
            approver: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(updatedRequest)
  } catch (error) {
    console.error('Error updating request:', error)
    return NextResponse.json(
      { error: 'Failed to update request' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    const resourceRequest = await prisma.resourceRequest.findUnique({
      where: { id },
      include: {
        resourceTemplate: {
          include: {
            fields: true
          }
        },
        phase: {
          include: {
            project: true
          }
        },
        approvals: {
          include: {
            approver: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!resourceRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    // Check if user is the requester or an admin/department head who can view it
    if (resourceRequest.userId !== session.user.id && session.user.userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'You do not have access to this request' },
        { status: 403 }
      )
    }

    // Check if request can still be edited
    const canEdit = resourceRequest.status !== 'REJECTED' && 
                    resourceRequest.status !== 'APPROVED' && 
                    resourceRequest.status !== 'ASSIGNED_TO_IT' && 
                    resourceRequest.status !== 'COMPLETED' &&
                    (resourceRequest.currentLevel === 0 || !resourceRequest.approvals.some(a => a.approvalLevel === 1 && a.status === 'APPROVED'))

    return NextResponse.json({
      ...resourceRequest,
      canEdit,
      requestedConfig: typeof resourceRequest.requestedConfig === 'string' 
        ? JSON.parse(resourceRequest.requestedConfig) 
        : resourceRequest.requestedConfig
    })
  } catch (error) {
    console.error('Error fetching request:', error)
    return NextResponse.json(
      { error: 'Failed to fetch request' },
      { status: 500 }
    )
  }
}
