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

    let requests

    if (session.user.role === 'ADMIN') {
      requests = await prisma.resourceRequest.findMany({
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
          approvedBy: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    } else {
      requests = await prisma.resourceRequest.findMany({
        where: { userId: session.user.id },
        include: {
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
          approvedBy: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    }

    return NextResponse.json(requests)
  } catch (error) {
    console.error('Error fetching requests:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
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

    const {
      phaseId,
      resourceTemplateId,
      resourceType,
      requestedConfig,
      requestedQty,
      justification
    } = await request.json()

    if (!phaseId || !requestedConfig || !requestedQty) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Must have either resourceTemplateId or resourceType
    if (!resourceTemplateId && !resourceType) {
      return NextResponse.json(
        { error: 'Either resourceTemplateId or resourceType is required' },
        { status: 400 }
      )
    }

    // Verify user has access to this phase
    const phase = await prisma.phase.findUnique({
      where: { id: phaseId },
      include: {
        project: {
          include: {
            users: true
          }
        },
        resources: {
          include: {
            resourceTemplate: true
          }
        }
      }
    })

    if (!phase) {
      return NextResponse.json({ error: 'Phase not found' }, { status: 404 })
    }

    if (session.user.role !== 'ADMIN') {
      const hasAccess = phase.project.users.some(user => user.id === session.user.id)
      if (!hasAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Validate resource availability
    let selectedResource = null
    if (resourceTemplateId) {
      // Template-based request validation
      selectedResource = phase.resources.find(r => r.resourceTemplateId === resourceTemplateId)
      if (!selectedResource) {
        return NextResponse.json(
          { error: 'Resource template not available in this phase' },
          { status: 400 }
        )
      }
    } else if (resourceType) {
      // Flexible resource request validation
      selectedResource = phase.resources.find(r => r.resourceType === resourceType)
      if (!selectedResource) {
        return NextResponse.json(
          { error: 'Resource type not available in this phase' },
          { status: 400 }
        )
      }
    }

    if (selectedResource) {
      // Calculate available quantity by finding all approved requests for this resource
      const approvedRequestsQuery: any = {
        status: 'APPROVED',
        phaseId: phaseId
      }
      
      // Add resource-specific filters
      if (resourceTemplateId) {
        approvedRequestsQuery.resourceTemplateId = resourceTemplateId
      } else if (resourceType) {
        approvedRequestsQuery.resourceType = resourceType
      }
      
      const approvedRequests = await prisma.resourceRequest.findMany({
        where: approvedRequestsQuery
      })
      
      const totalApprovedQuantity = approvedRequests.reduce((sum, req) => sum + req.requestedQty, 0)
      const availableQuantity = selectedResource.quantity - totalApprovedQuantity
      
      if (requestedQty > availableQuantity) {
        return NextResponse.json(
          { 
            error: `Insufficient resources available. Only ${availableQuantity} units available (${selectedResource.quantity} total, ${totalApprovedQuantity} already allocated)`,
            availableQuantity,
            totalQuantity: selectedResource.quantity,
            allocatedQuantity: totalApprovedQuantity
          },
          { status: 400 }
        )
      }
    }

    const resourceRequestData: any = {
      userId: session.user.id,
      phaseId,
      requestedConfig: JSON.stringify(requestedConfig),
      requestedQty: parseInt(requestedQty),
      justification
    }

    // Add either resourceTemplateId or resourceType
    if (resourceTemplateId) {
      resourceRequestData.resourceTemplateId = resourceTemplateId
    }
    if (resourceType) {
      resourceRequestData.resourceType = resourceType
    }

    const resourceRequest = await prisma.resourceRequest.create({
      data: resourceRequestData,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        resourceTemplate: resourceTemplateId ? {
          select: { id: true, name: true, description: true }
        } : undefined,
        phase: {
          include: {
            project: {
              select: { id: true, name: true, client: true }
            }
          }
        }
      }
    })

    return NextResponse.json(resourceRequest, { status: 201 })
  } catch (error) {
    console.error('Error creating request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}