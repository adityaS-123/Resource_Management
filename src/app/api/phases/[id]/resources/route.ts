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
    const resources = await prisma.resource.findMany({
      where: { phaseId: id },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json(resources)
  } catch (error) {
    console.error('Error fetching resources:', error)
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
    const {
      resourceType,
      resourceTemplateId,
      configuration,
      quantity
    } = await request.json()

    if (!resourceType || !quantity) {
      return NextResponse.json(
        { error: 'Missing required fields: resourceType, quantity' },
        { status: 400 }
      )
    }

    const resource = await prisma.resource.create({
      data: {
        resourceType,
        resourceTemplateId: resourceTemplateId || null,
        configuration: configuration || '{}',
        quantity: parseInt(quantity),
        costPerUnit: 0, // Default to 0 since we removed cost tracking
        phaseId: id
      }
    })

    return NextResponse.json(resource, { status: 201 })
  } catch (error) {
    console.error('Error creating resource:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}