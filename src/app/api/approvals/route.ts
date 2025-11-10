import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendApprovalNotification } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { requestId, action, comments } = await request.json()

    if (!requestId || !action) {
      return NextResponse.json(
        { error: 'Request ID and action are required' },
        { status: 400 }
      )
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be approve or reject' },
        { status: 400 }
      )
    }

    // Get the resource request with approvals
    const resourceRequest = await prisma.resourceRequest.findUnique({
      where: { id: requestId },
      include: {
        user: true,
        phase: {
          include: {
            project: true
          }
        },
        resourceTemplate: true,
        approvals: {
          include: {
            approver: true
          },
          orderBy: { approvalLevel: 'asc' }
        }
      }
    })

    if (!resourceRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    console.log('FULL REQUEST DATA:', {
      id: resourceRequest.id,
      status: resourceRequest.status,
      currentLevel: resourceRequest.currentLevel,
      requiredLevels: resourceRequest.requiredLevels,
      approvals: resourceRequest.approvals.map(a => ({
        level: a.approvalLevel,
        status: a.status,
        approver: a.approver.email,
        approverRole: a.approver.userRole
      }))
    })

    // Check user permissions based on their role and current approval level
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Determine what approval level this user can handle
    let userApprovalLevel = 0
    if (user.userRole === 'DEPARTMENT_HEAD') {
      userApprovalLevel = 1
    } else if (user.userRole === 'IT_HEAD') {
      userApprovalLevel = 2
    } else if (user.role === 'ADMIN' || user.userRole === 'ADMIN') {
      userApprovalLevel = 3
    }

    if (userApprovalLevel === 0) {
      return NextResponse.json({ 
        error: 'You do not have approval permissions' 
      }, { status: 403 })
    }

    // Check if this user should handle the current approval level
    const nextRequiredLevel = resourceRequest.currentLevel + 1
    
    console.log('Approval Debug:', {
      requestId,
      currentLevel: resourceRequest.currentLevel,
      requiredLevels: resourceRequest.requiredLevels,
      nextRequiredLevel,
      userApprovalLevel,
      userRole: user.userRole,
      userId: user.id,
      approvals: resourceRequest.approvals.map(a => ({ 
        level: a.approvalLevel, 
        status: a.status,
        isForThisUser: a.approverId === session.user.id
      }))
    })
    
    // First check: has this request completed all required approvals?
    if (nextRequiredLevel > resourceRequest.requiredLevels) {
      return NextResponse.json({ 
        error: 'This request has already completed all required approvals' 
      }, { status: 400 })
    }
    
    // Find the approval record that should be handled at nextRequiredLevel
    const nextApprovalToHandle = resourceRequest.approvals.find(
      a => a.approvalLevel === nextRequiredLevel
    )
    
    if (!nextApprovalToHandle) {
      return NextResponse.json({ 
        error: 'No approval record found for this level' 
      }, { status: 400 })
    }
    
    // Check if this approval is still pending
    if (nextApprovalToHandle.status !== 'PENDING') {
      return NextResponse.json({ 
        error: `This approval has already been ${nextApprovalToHandle.status.toLowerCase()}` 
      }, { status: 400 })
    }
    
    // Check if user has the right level to approve
    if (userApprovalLevel < nextRequiredLevel) {
      return NextResponse.json({ 
        error: `This request requires level ${nextRequiredLevel} approval. Your approval level is ${userApprovalLevel}` 
      }, { status: 403 })
    }

    // Process the approval/rejection
    const result = await prisma.$transaction(async (tx) => {
      // Create or update approval record
      const approvalRecord = await tx.approvalRecord.upsert({
        where: {
          resourceRequestId_approvalLevel: {
            resourceRequestId: requestId,
            approvalLevel: nextRequiredLevel
          }
        },
        create: {
          resourceRequestId: requestId,
          approverId: session.user.id,
          approvalLevel: nextRequiredLevel,
          status: action === 'approve' ? 'APPROVED' : 'REJECTED',
          comments,
          approvedAt: action === 'approve' ? new Date() : null
        },
        update: {
          approverId: session.user.id,
          status: action === 'approve' ? 'APPROVED' : 'REJECTED',
          comments,
          approvedAt: action === 'approve' ? new Date() : null,
          updatedAt: new Date()
        }
      })

      let updatedRequest
      
      if (action === 'reject') {
        // If rejected, update request status to rejected
        updatedRequest = await tx.resourceRequest.update({
          where: { id: requestId },
          data: {
            status: 'REJECTED',
            rejectionReason: comments,
            updatedAt: new Date()
          }
        })
      } else {
        // If approved, check if this was the final required level
        if (nextRequiredLevel >= resourceRequest.requiredLevels) {
          // Final approval - assign to IT team
          updatedRequest = await tx.resourceRequest.update({
            where: { id: requestId },
            data: {
              status: 'ASSIGNED_TO_IT',
              currentLevel: nextRequiredLevel,
              assignedToIT: true,
              updatedAt: new Date()
            }
          })

          // If this was a project resource request, update consumed quantity
          if (resourceRequest.resourceId) {
            await tx.resource.update({
              where: { id: resourceRequest.resourceId },
              data: {
                consumedQuantity: {
                  increment: resourceRequest.requestedQty
                }
              }
            })
          }
        } else {
          // Intermediate approval - move to next level
          updatedRequest = await tx.resourceRequest.update({
            where: { id: requestId },
            data: {
              status: 'IN_PROGRESS',
              currentLevel: nextRequiredLevel,
              updatedAt: new Date()
            }
          })

          // Create next approval record for the next level
          const nextLevel = nextRequiredLevel + 1
          console.log('Creating next approval for level:', nextLevel)
          console.log('Required levels:', resourceRequest.requiredLevels)
          
          if (nextLevel <= resourceRequest.requiredLevels) {
            // Determine the next approver role
            let nextApproverRole: 'DEPARTMENT_HEAD' | 'IT_HEAD' | 'ADMIN' = 'DEPARTMENT_HEAD'
            if (nextLevel === 2) {
              nextApproverRole = 'IT_HEAD'
            } else if (nextLevel === 3) {
              nextApproverRole = 'ADMIN'
            }
            
            console.log('Looking for approver with role:', nextApproverRole)

            // Find an available approver with the required role
            const nextApprover = await tx.user.findFirst({
              where: {
                OR: [
                  { userRole: nextApproverRole },
                  ...(nextApproverRole === 'ADMIN' ? [{ role: 'ADMIN' as const }] : [])
                ]
              },
              select: { id: true, name: true, email: true }
            })

            console.log('Found next approver:', nextApprover)

            if (nextApprover) {
              const newApprovalRecord = await tx.approvalRecord.create({
                data: {
                  resourceRequestId: requestId,
                  approverId: nextApprover.id,
                  approvalLevel: nextLevel,
                  status: 'PENDING'
                }
              })
              console.log('Created approval record:', newApprovalRecord)
            } else {
              console.log('No approver found for role:', nextApproverRole)
            }
          }
        }
      }

      return { approvalRecord, updatedRequest }
    })

    // Send notification emails
    try {
      if (action === 'reject') {
        // Notify the requester about rejection
        await sendApprovalNotification(resourceRequest.user.email, {
          requestId: resourceRequest.id,
          status: 'REJECTED',
          approverName: user.name || user.email,
          approverLevel: nextRequiredLevel,
          comments,
          resourceType: resourceRequest.resourceTemplate?.name || resourceRequest.resourceType || 'Resource',
          projectName: resourceRequest.phase.project.name
        })
      } else {
        // If approved and this was the final level, notify IT team
        if (nextRequiredLevel >= resourceRequest.requiredLevels) {
          // Notify IT team
          const itUsers = await prisma.user.findMany({
            where: { userRole: 'IT_TEAM' }
          })

          for (const itUser of itUsers) {
            await sendApprovalNotification(itUser.email, {
              requestId: resourceRequest.id,
              status: 'ASSIGNED_TO_IT',
              resourceType: resourceRequest.resourceTemplate?.name || resourceRequest.resourceType || 'Resource',
              projectName: resourceRequest.phase.project.name,
              userEmail: resourceRequest.user.email,
              userName: resourceRequest.user.name || resourceRequest.user.email,
              requestedConfig: JSON.parse(resourceRequest.requestedConfig),
              requestedQuantity: resourceRequest.requestedQty
            })
          }

          // Notify the requester that request is approved and assigned to IT
          await sendApprovalNotification(resourceRequest.user.email, {
            requestId: resourceRequest.id,
            status: 'APPROVED',
            approverName: user.name || user.email,
            approverLevel: nextRequiredLevel,
            resourceType: resourceRequest.resourceTemplate?.name || resourceRequest.resourceType || 'Resource',
            projectName: resourceRequest.phase.project.name
          })
        } else {
          // Notify next level approver
          const nextLevel = nextRequiredLevel + 1
          let nextApprovers: { email: string; name: string | null }[] = []
          
          if (nextLevel === 2) {
            nextApprovers = await prisma.user.findMany({
              where: { userRole: 'IT_HEAD' },
              select: { email: true, name: true }
            })
          } else if (nextLevel === 3) {
            nextApprovers = await prisma.user.findMany({
              where: { 
                OR: [
                  { role: 'ADMIN' },
                  { userRole: 'ADMIN' }
                ]
              },
              select: { email: true, name: true }
            })
          }

          for (const nextApprover of nextApprovers) {
            await sendApprovalNotification(nextApprover.email, {
              requestId: resourceRequest.id,
              status: 'PENDING_APPROVAL',
              requiredLevel: nextLevel,
              resourceType: resourceRequest.resourceTemplate?.name || resourceRequest.resourceType || 'Resource',
              projectName: resourceRequest.phase.project.name,
              userEmail: resourceRequest.user.email,
              userName: resourceRequest.user.name || resourceRequest.user.email,
              requestedConfig: JSON.parse(resourceRequest.requestedConfig),
              requestedQuantity: resourceRequest.requestedQty,
              justification: resourceRequest.justification || undefined
            })
          }
        }
      }
    } catch (emailError) {
      console.error('Failed to send notification emails:', emailError)
    }

    // Return the updated request with full details
    const finalRequest = await prisma.resourceRequest.findUnique({
      where: { id: requestId },
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
        resourceTemplate: true,
        approvals: {
          include: {
            approver: {
              select: { id: true, name: true, email: true, userRole: true }
            }
          },
          orderBy: { approvalLevel: 'asc' }
        }
      }
    })

    return NextResponse.json(finalRequest)
  } catch (error) {
    console.error('Error processing approval:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}