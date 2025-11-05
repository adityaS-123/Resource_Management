import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendResourceRequestNotification } from '@/lib/email'

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
            select: { 
              id: true, 
              name: true, 
              description: true,
              fields: {
                select: {
                  id: true,
                  name: true,
                  label: true,
                  fieldType: true,
                  isRequired: true,
                  defaultValue: true,
                  options: true,
                  unit: true,
                  minValue: true,
                  maxValue: true,
                  sortOrder: true
                },
                orderBy: { sortOrder: 'asc' }
              }
            }
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
            select: { 
              id: true, 
              name: true, 
              description: true,
              fields: {
                select: {
                  id: true,
                  name: true,
                  label: true,
                  fieldType: true,
                  isRequired: true,
                  defaultValue: true,
                  options: true,
                  unit: true,
                  minValue: true,
                  maxValue: true,
                  sortOrder: true
                },
                orderBy: { sortOrder: 'asc' }
              }
            }
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
      resourceId,
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

    // Must have either resourceTemplateId, resourceId, or resourceType
    if (!resourceTemplateId && !resourceId && !resourceType) {
      return NextResponse.json(
        { error: 'Either resourceTemplateId, resourceId, or resourceType is required' },
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
    if (resourceId) {
      // Specific resource request validation
      selectedResource = phase.resources.find(r => r.id === resourceId)
      if (!selectedResource) {
        return NextResponse.json(
          { error: 'Specific resource not found in this phase' },
          { status: 400 }
        )
      }
    } else if (resourceTemplateId) {
      // Template-based request - check if template exists in system (not necessarily in project)
      const resourceTemplate = await prisma.resourceTemplate.findUnique({
        where: { id: resourceTemplateId, isActive: true }
      })
      
      if (!resourceTemplate) {
        return NextResponse.json(
          { error: 'Resource template not found or inactive' },
          { status: 400 }
        )
      }
      
      // For template requests, we don't require a pre-configured resource in the project
      // This allows requesting any available template as "additional resources"
      selectedResource = null // Template requests don't need resource validation
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
      if (resourceId) {
        // For specific resource requests, use the consumedQuantity field
        const availableQuantity = selectedResource.quantity - selectedResource.consumedQuantity
        
        if (availableQuantity <= 0) {
          return NextResponse.json(
            { 
              error: `Resource is fully allocated. No units available (${selectedResource.quantity} total, ${selectedResource.consumedQuantity} already consumed)`,
              availableQuantity: 0,
              totalQuantity: selectedResource.quantity,
              consumedQuantity: selectedResource.consumedQuantity
            },
            { status: 400 }
          )
        }
        
        if (requestedQty > availableQuantity) {
          return NextResponse.json(
            { 
              error: `Insufficient resources available. Only ${availableQuantity} units available (${selectedResource.quantity} total, ${selectedResource.consumedQuantity} already consumed)`,
              availableQuantity,
              totalQuantity: selectedResource.quantity,
              consumedQuantity: selectedResource.consumedQuantity
            },
            { status: 400 }
          )
        }
      } else if (resourceTemplateId) {
        // For template-based requests, we don't enforce quantity limits
        // These are "additional resources" that require admin approval
        // Admins can decide based on availability and business rules
        approvedRequestsQuery.resourceTemplateId = resourceTemplateId
      } else if (resourceType) {
        // For resource type requests, calculate from approved requests
        approvedRequestsQuery.resourceType = resourceType
        
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
    }

    // Determine if this should be auto-approved (project-specific resources)
    const isProjectResource = !!resourceId
    const shouldAutoApprove = isProjectResource

    const resourceRequestData: any = {
      userId: session.user.id,
      phaseId,
      requestedConfig: JSON.stringify(requestedConfig),
      requestedQty: parseInt(requestedQty),
      justification,
      status: shouldAutoApprove ? 'APPROVED' : 'PENDING',
      approvedAt: shouldAutoApprove ? new Date() : null,
      approvedById: shouldAutoApprove ? session.user.id : null // System auto-approval
    }

    // Add either resourceTemplateId, resourceId, or resourceType
    if (resourceTemplateId) {
      resourceRequestData.resourceTemplateId = resourceTemplateId
    }
    if (resourceId) {
      resourceRequestData.resourceId = resourceId
    }
    if (resourceType) {
      resourceRequestData.resourceType = resourceType
    }

    // Use transaction to create request and update resource consumption if auto-approved
    const resourceRequest = await prisma.$transaction(async (tx) => {
      const createdRequest = await tx.resourceRequest.create({
        data: resourceRequestData,
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          resourceTemplate: resourceTemplateId ? {
            select: { 
              id: true, 
              name: true, 
              description: true,
              fields: {
                select: {
                  id: true,
                  name: true,
                  label: true,
                  fieldType: true,
                  isRequired: true,
                  defaultValue: true,
                  options: true,
                  unit: true,
                  minValue: true,
                  maxValue: true,
                  sortOrder: true
                },
                orderBy: { sortOrder: 'asc' }
              }
            }
          } : undefined,
          phase: {
            include: {
              project: {
                select: { id: true, name: true, client: true }
              }
            }
          },
          approvedBy: shouldAutoApprove ? {
            select: { id: true, name: true, email: true }
          } : undefined
        }
      })

      // If auto-approved and project-specific resource, update consumed quantity
      if (shouldAutoApprove && resourceId) {
        await tx.resource.update({
          where: { id: resourceId },
          data: {
            consumedQuantity: {
              increment: parseInt(requestedQty)
            }
          }
        })
      }

      return createdRequest
    })

    // Send email notification to admin
    try {
      // Get admin users
      const adminUsers = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { email: true }
      })

      if (adminUsers.length > 0) {
        // Prepare email data
        const emailData = {
          requestId: resourceRequest.id,
          userEmail: resourceRequest.user.email,
          userName: resourceRequest.user.name || resourceRequest.user.email,
          projectName: resourceRequest.phase.project.name,
          client: resourceRequest.phase.project.client,
          phaseName: resourceRequest.phase.name,
          resourceType: resourceRequest.resourceTemplate?.name || resourceType || 'Resource',
          resourceName: resourceRequest.resourceTemplate?.name,
          requestedQuantity: resourceRequest.requestedQty,
          requestedConfig: JSON.parse(resourceRequest.requestedConfig),
          justification: resourceRequest.justification || undefined,
          status: resourceRequest.status as 'PENDING' | 'APPROVED',
          isAutoApproved: shouldAutoApprove,
          requestUrl: `${process.env.NEXTAUTH_URL}/admin/requests`
        }

        // Send emails to all admins
        for (const admin of adminUsers) {
          await sendResourceRequestNotification(admin.email, emailData)
        }
      }
    } catch (emailError) {
      // Log email error but don't fail the request
      console.error('Failed to send email notification:', emailError)
    }

    return NextResponse.json(resourceRequest, { status: 201 })
  } catch (error) {
    console.error('Error creating request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
