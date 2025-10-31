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
    if (userEmails && userEmails.length > 0) {
      users = await prisma.user.findMany({
        where: {
          email: { in: userEmails },
          role: 'USER'
        }
      })
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
        }
      }
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}