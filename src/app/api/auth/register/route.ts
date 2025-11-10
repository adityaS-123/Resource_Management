import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role = 'USER', departmentId } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Validate department if provided
    if (departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: departmentId }
      })
      
      if (!department) {
        return NextResponse.json(
          { error: 'Invalid department selected' },
          { status: 400 }
        )
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role as 'ADMIN' | 'USER',
        departmentId: departmentId || null,
        userRole: departmentId ? 'REGULAR_USER' : undefined
      },
      include: {
        department: true
      }
    })

    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json(userWithoutPassword, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}