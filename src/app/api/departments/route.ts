import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/departments - Fetch all departments for registration dropdown
export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        head: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(departments)
  } catch (error) {
    console.error('Error fetching departments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/departments - Create a new department (admin only)
export async function POST(request: Request) {
  try {
    const { name, description, headId } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Department name is required' },
        { status: 400 }
      )
    }

    // Check if department already exists
    const existing = await prisma.department.findUnique({
      where: { name }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Department already exists' },
        { status: 400 }
      )
    }

    const department = await prisma.department.create({
      data: {
        name,
        description: description || null,
        headId: headId || null
      },
      include: {
        head: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        members: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(department, { status: 201 })
  } catch (error) {
    console.error('Error creating department:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
