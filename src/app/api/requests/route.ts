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

    // Get user's full profile to check userRole
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, userRole: true }
    })

    if (session.user.role === 'ADMIN' || currentUser?.userRole === 'ADMIN') {
      // Admins see all requests
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
          approvals: {
            include: {
              approver: {
                select: { id: true, name: true, email: true }
              }
            },
            orderBy: { approvalLevel: 'asc' }
          },
          approvedBy: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    } else if (currentUser?.userRole === 'DEPARTMENT_HEAD' || currentUser?.userRole === 'IT_HEAD') {
      // Department heads and IT heads see requests requiring their approval
      console.log('Fetching requests for role:', currentUser.userRole, 'User ID:', session.user.id)
      
      // First, let's see what approval records exist for this user
      const allApprovalRecords = await prisma.approvalRecord.findMany({
        where: {
          approverId: session.user.id
        },
        include: {
          resourceRequest: {
            select: {
              id: true,
              status: true,
              currentLevel: true,
              requiredLevels: true,
              user: {
                select: { name: true, email: true }
              }
            }
          }
        }
      })
      
      console.log('All approval records for user:', allApprovalRecords.map(ar => ({
        requestId: ar.resourceRequestId,
        level: ar.approvalLevel,
        status: ar.status,
        requestStatus: ar.resourceRequest.status,
        currentLevel: ar.resourceRequest.currentLevel,
        requiredLevels: ar.resourceRequest.requiredLevels,
        requester: ar.resourceRequest.user.name
      })))
      
      requests = await prisma.resourceRequest.findMany({
        where: {
          approvals: {
            some: {
              approverId: session.user.id,
              status: 'PENDING'
            }
          }
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
          approvals: {
            include: {
              approver: {
                select: { id: true, name: true, email: true }
              }
            },
            orderBy: { approvalLevel: 'asc' }
          },
          approvedBy: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
      
      console.log('Found requests for', currentUser.userRole, ':', requests.length)
      console.log('Request IDs:', requests.map(r => ({ id: r.id, status: r.status, currentLevel: r.currentLevel })))
    } else {
      // Regular users see only their own requests
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
          approvals: {
            include: {
              approver: {
                select: { id: true, name: true, email: true }
              }
            },
            orderBy: { approvalLevel: 'asc' }
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

    // Determine approval workflow based on request type
    // REMOVED AUTO-APPROVAL: All requests now require at least Level 1 approval
    let shouldAutoApprove = false
    let requiredLevels = 1 // Minimum Level 1 approval required

    // For resource template requests, check approval levels (but minimum is 1)
    if (resourceTemplateId) {
      const resourceTemplate = await prisma.resourceTemplate.findUnique({
        where: { id: resourceTemplateId },
        select: { approvalLevels: true }
      })

      if (resourceTemplate) {
        // Ensure minimum Level 1 approval, even if template says 0
        requiredLevels = Math.max(resourceTemplate.approvalLevels || 1, 1)
        shouldAutoApprove = false // Never auto-approve
      }
    }

    const resourceRequestData: any = {
      userId: session.user.id,
      phaseId,
      requestedConfig: JSON.stringify(requestedConfig),
      requestedQty: parseInt(requestedQty),
      justification,
      requiredLevels,
      status: 'PENDING', // Always PENDING - no auto-approval
      approvedAt: null,
      approvedById: null
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
              approvalLevels: true,
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
          approvals: {
            include: {
              approver: {
                select: { id: true, name: true, email: true }
              }
            },
            orderBy: { approvalLevel: 'asc' }
          },
          phase: {
            include: {
              project: {
                select: { id: true, name: true, client: true }
              }
            }
          }
        }
      })

      // NO AUTO-APPROVAL: Never update consumed quantity during request creation
      // Resources are only consumed after IT team completion

      // ALL requests require approval, create the first approval record
      if (requiredLevels > 0) {
        // Always start with Level 1 approval (Department Head)
        // Level 1 is MANDATORY for all requests
        const firstApprovalLevel = 1

        // Find the department head for this request
        // Get the requester's department
        const requester = await tx.user.findUnique({
          where: { id: session.user.id },
          select: { departmentId: true }
        })

        let departmentHeadId: string | null = null
        if (requester?.departmentId) {
          const department = await tx.department.findUnique({
            where: { id: requester.departmentId },
            select: { headId: true }
          })
          departmentHeadId = department?.headId || null
        }

        // Create Level 1 approval record (always for department head)
        if (departmentHeadId) {
          await tx.approvalRecord.create({
            data: {
              resourceRequestId: createdRequest.id,
              approverId: departmentHeadId,
              approvalLevel: firstApprovalLevel,
              status: 'PENDING'
            }
          })
        }
      }

      return createdRequest
    })

    // Send email notification to appropriate approver
    try {
      // ALL requests require approval now - send to department head for Level 1 approval
      if (requiredLevels > 0) {
        // Get the requester's department and department head
        const requester = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { departmentId: true }
        })

        if (requester?.departmentId) {
          const department = await prisma.department.findUnique({
            where: { id: requester.departmentId },
            include: {
              head: {
                select: { email: true, name: true }
              }
            }
          })

          if (department?.head) {
            // Prepare email data
            const emailData = {
              requestId: resourceRequest.id,
              userEmail: resourceRequest.user.email,
              userName: resourceRequest.user.name || resourceRequest.user.email,
              projectName: resourceRequest.phase.project.name,
              client: resourceRequest.phase.project.client,
              phaseName: resourceRequest.phase.name,
              resourceType: resourceRequest.resourceTemplate?.name || resourceRequest.resourceType || 'Resource',
              resourceName: resourceRequest.resourceTemplate?.name,
              requestedQuantity: resourceRequest.requestedQty,
              requestedConfig: JSON.parse(resourceRequest.requestedConfig),
              justification: resourceRequest.justification || undefined,
              status: resourceRequest.status as 'PENDING',
              isAutoApproved: false, // Never auto-approved now
              approverRole: 'DEPARTMENT_HEAD',
              approverName: department.head.name || department.head.email
            }

            // Send to department head for first approval
            await fetch(`${process.env.NEXTAUTH_URL}/api/notifications/email`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: department.head.email,
                type: 'resource-request',
                data: emailData
              })
            })
          }
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
