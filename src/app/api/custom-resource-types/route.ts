import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/custom-resource-types
export async function GET(request: NextRequest) {
	try {
		const templates = await prisma.resourceTemplate.findMany({
			orderBy: { createdAt: 'desc' }
		})
		return NextResponse.json(templates)
	} catch (error) {
		console.error('Error fetching resource templates:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

// POST /api/custom-resource-types
export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const created = await prisma.resourceTemplate.create({ data: body })
		return NextResponse.json(created, { status: 201 })
	} catch (error) {
		console.error('Error creating resource template:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

