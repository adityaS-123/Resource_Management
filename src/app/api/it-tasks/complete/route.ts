import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendTaskCompletionNotification } from '@/lib/email'

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

    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.userRole !== 'IT_TEAM')) {
      return NextResponse.json({ error: 'Access denied. IT team access required.' }, { status: 403 })
    }

    const { requestId, completionNotes, credentials } = await request.json()

    if (!requestId || !completionNotes) {
      return NextResponse.json(
        { error: 'Request ID and completion notes are required' },
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

    if (resourceRequest.status !== 'ASSIGNED_TO_IT') {
      return NextResponse.json({ 
        error: 'Request is not in ASSIGNED_TO_IT status' 
      }, { status: 400 })
    }

    // Complete the task
    const completedRequest = await prisma.resourceRequest.update({
      where: { id: requestId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        completedById: session.user.id,
        completionNotes,
        credentials: credentials || null,
        updatedAt: new Date()
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
        resourceTemplate: true,
        completedBy: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    // Send notification to the requester
    try {
      const parsedCredentials = credentials ? JSON.parse(credentials) : []
      
      await sendTaskCompletionNotification(resourceRequest.user.email, {
        requestId: resourceRequest.id,
        userEmail: resourceRequest.user.email,
        userName: resourceRequest.user.name || resourceRequest.user.email,
        projectName: resourceRequest.phase.project.name,
        phaseName: resourceRequest.phase.name,
        resourceType: resourceRequest.resourceTemplate?.name || resourceRequest.resourceType || 'Resource',
        completionNotes,
        credentials: parsedCredentials,
        completedBy: currentUser.userRole === 'IT_TEAM' ? 'IT Team' : 'Admin',
        requestUrl: `${process.env.NEXTAUTH_URL}/dashboard/my-requests`
      })
    } catch (emailError) {
      console.error('Failed to send completion notification:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json(completedRequest)
  } catch (error) {
    console.error('Error completing task:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}