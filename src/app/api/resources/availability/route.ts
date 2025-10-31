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

    const { phaseId, resourceTemplateId, resourceType } = await request.json()

    if (!phaseId || (!resourceTemplateId && !resourceType)) {
      return NextResponse.json(
        { error: 'phaseId and either resourceTemplateId or resourceType is required' },
        { status: 400 }
      )
    }

    // Get the phase with resources
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

    // Check user access
    if (session.user.role !== 'ADMIN') {
      const hasAccess = phase.project.users.some(user => user.id === session.user.id)
      if (!hasAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Find the specific resource
    let targetResource = null
    if (resourceTemplateId) {
      targetResource = phase.resources.find(r => r.resourceTemplateId === resourceTemplateId)
    } else if (resourceType) {
      targetResource = phase.resources.find(r => r.resourceType === resourceType)
    }

    if (!targetResource) {
      return NextResponse.json({
        available: false,
        error: 'Resource not found in this phase',
        totalQuantity: 0,
        allocatedQuantity: 0,
        availableQuantity: 0
      })
    }

    // Calculate allocated quantity from approved requests
    const approvedRequestsQuery: any = {
      status: 'APPROVED',
      phaseId: phaseId
    }
    
    if (resourceTemplateId) {
      approvedRequestsQuery.resourceTemplateId = resourceTemplateId
    } else if (resourceType) {
      approvedRequestsQuery.resourceType = resourceType
    }
    
    const approvedRequests = await prisma.resourceRequest.findMany({
      where: approvedRequestsQuery,
      select: {
        requestedQty: true,
        user: {
          select: { id: true, name: true, email: true }
        },
        approvedAt: true
      }
    })
    
    const totalAllocatedQuantity = approvedRequests.reduce((sum, req) => sum + req.requestedQty, 0)
    const availableQuantity = targetResource.quantity - totalAllocatedQuantity

    return NextResponse.json({
      available: availableQuantity > 0,
      totalQuantity: targetResource.quantity,
      allocatedQuantity: totalAllocatedQuantity,
      availableQuantity,
      resourceType: targetResource.resourceType,
      configuration: JSON.parse(targetResource.configuration),
      costPerUnit: targetResource.costPerUnit,
      allocatedTo: approvedRequests.map(req => ({
        quantity: req.requestedQty,
        user: req.user,
        approvedAt: req.approvedAt
      }))
    })
  } catch (error) {
    console.error('Error checking resource availability:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}