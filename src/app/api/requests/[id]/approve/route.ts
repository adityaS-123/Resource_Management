import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const { status, rejectionReason } = await request.json()

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    if (status === 'REJECTED' && !rejectionReason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      )
    }

    // First, get the request to check what we're approving
    const existingRequest = await prisma.resourceRequest.findUnique({
      where: { id },
      include: {
        phase: {
          include: {
            resources: true
          }
        }
      }
    })

    if (!existingRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // If approving, check resource availability and update consumption
    if (status === 'APPROVED') {
      // Find the resource that this request is for
      let targetResource = null
      if (existingRequest.resourceTemplateId) {
        targetResource = existingRequest.phase.resources.find(r => 
          r.resourceTemplateId === existingRequest.resourceTemplateId
        )
      } else if (existingRequest.resourceType) {
        targetResource = existingRequest.phase.resources.find(r => 
          r.resourceType === existingRequest.resourceType
        )
      }

      if (targetResource) {
        // Check current availability
        const approvedRequestsQuery: any = {
          status: 'APPROVED',
          phaseId: existingRequest.phaseId,
          id: { not: existingRequest.id } // Exclude current request
        }
        
        if (existingRequest.resourceTemplateId) {
          approvedRequestsQuery.resourceTemplateId = existingRequest.resourceTemplateId
        } else if (existingRequest.resourceType) {
          approvedRequestsQuery.resourceType = existingRequest.resourceType
        }
        
        const approvedRequests = await prisma.resourceRequest.findMany({
          where: approvedRequestsQuery
        })
        
        const totalApprovedQuantity = approvedRequests.reduce((sum, req) => sum + req.requestedQty, 0)
        const availableQuantity = targetResource.quantity - totalApprovedQuantity
        
        if (existingRequest.requestedQty > availableQuantity) {
          return NextResponse.json(
            { 
              error: `Cannot approve: Only ${availableQuantity} units available (${targetResource.quantity} total, ${totalApprovedQuantity} already allocated)`,
              availableQuantity,
              totalQuantity: targetResource.quantity,
              allocatedQuantity: totalApprovedQuantity
            },
            { status: 400 }
          )
        }
      }
    }

    const resourceRequest = await prisma.resourceRequest.update({
      where: { id },
      data: {
        status: status as 'APPROVED' | 'REJECTED',
        approvedById: session.user.id,
        approvedAt: new Date(),
        rejectionReason: status === 'REJECTED' ? rejectionReason : null
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
        approvedBy: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json(resourceRequest)
  } catch (error) {
    console.error('Error approving request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}