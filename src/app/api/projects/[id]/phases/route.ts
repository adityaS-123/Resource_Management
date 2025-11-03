import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    const phases = await prisma.phase.findMany({
      where: { projectId: id },
      include: {
        resources: true,
        resourceRequests: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json(phases)
  } catch (error) {
    console.error('Error fetching phases:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { name, duration } = await request.json()

    if (!name || !duration) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if a phase with the same name already exists in this project
    const existingPhase = await prisma.phase.findFirst({
      where: {
        projectId: id,
        name: name.trim()
      }
    })

    if (existingPhase) {
      return NextResponse.json(
        { error: 'A phase with this name already exists in this project' },
        { status: 400 }
      )
    }

    const phase = await prisma.phase.create({
      data: {
        name: name.trim(),
        duration: parseInt(duration),
        allocatedCost: 0, // Default to 0 since we removed cost tracking
        projectId: id
      },
      include: {
        resources: true
      }
    })

    return NextResponse.json(phase, { status: 201 })
  } catch (error) {
    console.error('Error creating phase:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}