import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Accept pending invitations when user registers/signs in
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find pending invitations for this user's email
    const pendingInvitations = await prisma.projectInvitation.findMany({
      where: {
        email: session.user.email,
        status: 'PENDING'
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            client: true
          }
        }
      }
    })

    if (pendingInvitations.length === 0) {
      return NextResponse.json({ 
        message: 'No pending invitations found',
        invitations: []
      })
    }

    // Add user to all projects they were invited to
    const projectIds = pendingInvitations.map(inv => inv.projectId)
    
    for (const projectId of projectIds) {
      // Add user to project
      await prisma.project.update({
        where: { id: projectId },
        data: {
          users: {
            connect: { id: session.user.id }
          }
        }
      })
    }

    // Mark invitations as accepted
    await prisma.projectInvitation.updateMany({
      where: {
        email: session.user.email,
        status: 'PENDING'
      },
      data: {
        status: 'ACCEPTED'
      }
    })

    return NextResponse.json({
      message: `Successfully accepted ${pendingInvitations.length} project invitations`,
      invitations: pendingInvitations.map(inv => ({
        projectId: inv.projectId,
        projectName: inv.project.name,
        client: inv.project.client
      }))
    })

  } catch (error) {
    console.error('Error processing invitations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get pending invitations for current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const pendingInvitations = await prisma.projectInvitation.findMany({
      where: {
        email: session.user.email,
        status: 'PENDING'
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            client: true,
            startDate: true,
            endDate: true
          }
        },
        invitedBy: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      invitations: pendingInvitations
    })

  } catch (error) {
    console.error('Error fetching invitations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}