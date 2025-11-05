import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendProjectInvitationEmail } from '@/lib/email'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let projects

    if (session.user.role === 'ADMIN') {
      projects = await prisma.project.findMany({
        include: {
          createdBy: {
            select: { id: true, name: true, email: true }
          },
          phases: {
            include: {
              resources: true,
              _count: {
                select: { resourceRequests: true }
              }
            }
          },
          users: {
            select: { id: true, name: true, email: true }
          },
          _count: {
            select: { phases: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    } else {
      projects = await prisma.project.findMany({
        where: {
          users: {
            some: { id: session.user.id }
          }
        },
        include: {
          phases: {
            include: {
              resources: true
            }
          }
        }
      })
    }

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      name,
      client,
      startDate,
      endDate,
      userEmails
    } = await request.json()

    if (!name || !client || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Find users by email if provided
    let users: { id: string; email: string; name: string | null }[] = []
    let unregisteredEmails: string[] = []
    
    if (userEmails && userEmails.length > 0) {
      // Find registered users
      users = await prisma.user.findMany({
        where: {
          email: { in: userEmails },
          role: 'USER'
        }
      })
      
      // Find unregistered emails
      const registeredEmails = users.map(user => user.email)
      unregisteredEmails = userEmails.filter((email: string) => !registeredEmails.includes(email))
    }

    const project = await prisma.project.create({
      data: {
        name,
        client,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        createdById: session.user.id,
        users: {
          connect: users.map(user => ({ id: user.id }))
        }
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        users: {
          select: { id: true, name: true, email: true }
        },
        phases: {
          include: {
            resources: true
          }
        }
      }
    })

    // Handle invitations for unregistered users
    if (unregisteredEmails.length > 0) {
      // Create invitations
      const invitations = unregisteredEmails.map(email => ({
        email,
        projectId: project.id,
        invitedById: session.user.id
      }))
      
      await prisma.projectInvitation.createMany({
        data: invitations
      })
      
      // Send invitation emails
      const inviteUrl = `${process.env.NEXTAUTH_URL}/login`
      
      for (const email of unregisteredEmails) {
        try {
          await sendProjectInvitationEmail(email, {
            projectName: project.name,
            client: project.client,
            startDate: project.startDate.toISOString(),
            endDate: project.endDate.toISOString(),
            phases: project.phases.map(phase => ({
              name: phase.name,
              duration: phase.duration,
              resources: phase.resources.map(resource => ({
                identifier: resource.identifier || undefined,
                resourceType: resource.resourceType,
                quantity: resource.quantity,
                configuration: resource.configuration
              }))
            })),
            inviteUrl
          })
          
          // Mark email as sent
          await prisma.projectInvitation.updateMany({
            where: {
              email,
              projectId: project.id
            },
            data: {
              emailSent: true
            }
          })
        } catch (emailError) {
          console.error(`Failed to send invitation to ${email}:`, emailError)
        }
      }
    }

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}