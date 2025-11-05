import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendProjectInvitationEmail } from '@/lib/email'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        phases: {
          include: {
            resources: true,
            resourceRequests: {
              include: {
                user: {
                  select: { id: true, name: true, email: true }
                },
                resourceTemplate: {
                  select: { id: true, name: true, description: true }
                },
                approvedBy: {
                  select: { id: true, name: true, email: true }
                }
              }
            }
          }
        },
        users: {
          select: { id: true, name: true, email: true }
        },
        invitations: {
          select: {
            id: true,
            email: true,
            status: true,
            emailSent: true,
            createdAt: true
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Check if user has access to this project
    if (session.user.role !== 'ADMIN') {
      const hasAccess = project.users.some(user => user.id === session.user.id)
      if (!hasAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const {
      name,
      client,
      startDate,
      endDate,
      userEmails
    } = await request.json()

    // Build the update data object
    const updateData: any = {
      name,
      client,
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    }

    // Only update user relationships if userEmails is explicitly provided
    if (userEmails !== undefined) {
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
      
      updateData.users = {
        set: users.map(user => ({ id: user.id }))
      }
      
      // Handle invitations for unregistered users
      if (unregisteredEmails.length > 0) {
        // Remove old invitations for this project
        await prisma.projectInvitation.deleteMany({
          where: {
            projectId: id,
            email: { in: unregisteredEmails }
          }
        })
        
        // Create new invitations
        const invitations = unregisteredEmails.map(email => ({
          email,
          projectId: id,
          invitedById: session.user.id
        }))
        
        await prisma.projectInvitation.createMany({
          data: invitations
        })
        
        // Send invitation emails
        const updatedProject = await prisma.project.findUnique({
          where: { id },
          include: {
            phases: {
              include: {
                resources: true
              }
            }
          }
        })
        
        if (updatedProject) {
          const inviteUrl = `${process.env.NEXTAUTH_URL}/login`
          
          for (const email of unregisteredEmails) {
            try {
              await sendProjectInvitationEmail(email, {
                projectName: updatedProject.name,
                client: updatedProject.client,
                startDate: updatedProject.startDate.toISOString(),
                endDate: updatedProject.endDate.toISOString(),
                phases: updatedProject.phases.map(phase => ({
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
                  projectId: id
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
      }
    }

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        users: {
          select: { id: true, name: true, email: true }
        },
        invitations: {
          select: {
            id: true,
            email: true,
            status: true,
            emailSent: true,
            createdAt: true
          }
        }
      }
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      console.log('DELETE project: Unauthorized access attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    console.log('DELETE project: Attempting to delete project with ID:', id)

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        phases: {
          include: {
            resources: true,
            resourceRequests: true
          }
        }
      }
    })

    if (!project) {
      console.log('DELETE project: Project not found with ID:', id)
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    console.log('DELETE project: Found project:', project.name)
    console.log('DELETE project: Project has', project.phases.length, 'phases')

    // Use transaction to ensure all related data is deleted properly
    await prisma.$transaction(async (tx) => {
      // Delete resource requests first (they reference phases)
      for (const phase of project.phases) {
        const resourceRequestCount = await tx.resourceRequest.count({
          where: { phaseId: phase.id }
        })
        console.log(`DELETE project: Deleting ${resourceRequestCount} resource requests for phase ${phase.name}`)
        
        await tx.resourceRequest.deleteMany({
          where: { phaseId: phase.id }
        })
      }

      // Delete resources (they reference phases)
      for (const phase of project.phases) {
        const resourceCount = await tx.resource.count({
          where: { phaseId: phase.id }
        })
        console.log(`DELETE project: Deleting ${resourceCount} resources for phase ${phase.name}`)
        
        await tx.resource.deleteMany({
          where: { phaseId: phase.id }
        })
      }

      // Delete phases (they reference project)
      console.log('DELETE project: Deleting phases')
      await tx.phase.deleteMany({
        where: { projectId: id }
      })

      // Finally delete the project (this will also disconnect the many-to-many user relationships)
      console.log('DELETE project: Deleting project')
      await tx.project.delete({
        where: { id }
      })
    })

    console.log('DELETE project: Successfully deleted project with ID:', id)
    return NextResponse.json({ message: 'Project deleted successfully' })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}