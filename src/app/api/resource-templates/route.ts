import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/resource-templates - Get all resource templates
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resourceTemplates = await prisma.resourceTemplate.findMany({
      include: {
        fields: {
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(resourceTemplates)
  } catch (error) {
    console.error('Error fetching resource templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/resource-templates - Create a new resource template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, description, isActive, approvalLevels, fields } = await request.json()

    if (!name || !fields || !Array.isArray(fields)) {
      return NextResponse.json(
        { error: 'Missing required fields: name and fields array' },
        { status: 400 }
      )
    }

    // Validate approval levels - minimum Level 1 required
    if (approvalLevels !== undefined && (approvalLevels < 1 || approvalLevels > 3)) {
      return NextResponse.json(
        { error: 'Approval levels must be between 1 and 3 (Level 1 minimum required)' },
        { status: 400 }
      )
    }

    const resourceTemplate = await prisma.resourceTemplate.create({
      data: {
        name,
        description,
        isActive: isActive !== undefined ? isActive : true,
        approvalLevels: approvalLevels !== undefined ? Math.max(approvalLevels, 1) : 1, // Minimum Level 1
        fields: {
          create: fields.map((field: any, index: number) => ({
            name: field.name,
            label: field.label,
            fieldType: field.fieldType,
            isRequired: field.isRequired || false,
            defaultValue: field.defaultValue,
            options: field.options ? (typeof field.options === 'string' ? field.options : JSON.stringify(field.options)) : null,
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

    return NextResponse.json(resourceTemplate, { status: 201 })
  } catch (error) {
    console.error('Error creating resource template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}