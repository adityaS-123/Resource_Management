import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Function to generate unique identifier for resources
async function generateResourceIdentifier(phaseId: string, resourceType: string): Promise<string> {
  // Get all resources of the same type in this phase
  const existingResources = await prisma.resource.findMany({
    where: {
      phaseId,
      resourceType
    },
    select: {
      identifier: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  })

  // Extract existing identifiers and find the next available one
  const existingIdentifiers = existingResources
    .map(r => r.identifier)
    .filter(Boolean) as string[]

  // Create a simplified resource type prefix (e.g., "Virtual Machine" -> "VM", "Storage" -> "Storage")
  const typePrefix = resourceType
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 10) // Limit to 10 characters

  let counter = 1
  let suffix = 'a'
  
  while (true) {
    const identifier = `${typePrefix}-${counter}${suffix}`
    
    if (!existingIdentifiers.includes(identifier)) {
      return identifier
    }
    
    // Increment suffix (a -> b -> c ... z -> aa -> ab ...)
    if (suffix === 'z') {
      counter++
      suffix = 'a'
    } else {
      suffix = String.fromCharCode(suffix.charCodeAt(0) + 1)
    }
  }
}

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

    // Generate unique identifier for this resource
    const identifier = await generateResourceIdentifier(id, resourceType)

    const resource = await prisma.resource.create({
      data: {
        identifier,
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