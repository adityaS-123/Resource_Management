import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/resource-templates/[id] - Get a specific resource template
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

    const resourceTemplate = await prisma.resourceTemplate.findUnique({
      where: { id },
      include: {
        fields: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    if (!resourceTemplate) {
      return NextResponse.json(
        { error: 'Resource template not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(resourceTemplate)
  } catch (error) {
    console.error('Error fetching resource template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/resource-templates/[id] - Update a resource template
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
    const { name, description, fields } = await request.json()

    // Delete existing fields and create new ones
    await prisma.resourceField.deleteMany({
      where: { resourceTemplateId: id }
    })

    const resourceTemplate = await prisma.resourceTemplate.update({
      where: { id },
      data: {
        name,
        description,
        fields: {
          create: fields.map((field: any, index: number) => ({
            name: field.name,
            label: field.label,
            fieldType: field.fieldType,
            isRequired: field.isRequired || false,
            defaultValue: field.defaultValue,
            options: field.options ? JSON.stringify(field.options) : null,
            unit: field.unit,
            minValue: field.minValue,
            maxValue: field.maxValue,
            sortOrder: index
          }))
        }
      },
      include: {
        fields: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    return NextResponse.json(resourceTemplate)
  } catch (error) {
    console.error('Error updating resource template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/resource-templates/[id] - Partially update a resource template (e.g., toggle status)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { isActive } = await request.json()

    const resourceTemplate = await prisma.resourceTemplate.update({
      where: { id },
      data: { isActive },
      include: {
        fields: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    return NextResponse.json(resourceTemplate)
  } catch (error) {
    console.error('Error updating resource template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/resource-templates/[id] - Delete a resource template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    await prisma.resourceTemplate.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Resource template deleted successfully' })
  } catch (error) {
    console.error('Error deleting resource template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}