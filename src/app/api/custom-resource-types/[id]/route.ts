import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/custom-resource-types/:id
export async function GET(
	request: NextRequest,
	{ params }: { params: any }
) {
	try {
		const resolvedParams = params && typeof params.then === 'function' ? await params : params
		const id = resolvedParams?.id
		const resourceTemplate = await prisma.resourceTemplate.findUnique({
			where: { id }
		})

		if (!resourceTemplate) {
			return NextResponse.json({ error: 'Not found' }, { status: 404 })
		}

		return NextResponse.json(resourceTemplate)
	} catch (error) {
		console.error('Error fetching resource template by id:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

// PUT /api/custom-resource-types/:id
export async function PUT(
	request: NextRequest,
	{ params }: { params: any }
) {
	try {
		const resolvedParams = params && typeof params.then === 'function' ? await params : params
		const id = resolvedParams?.id
		const body = await request.json()

		const updated = await prisma.resourceTemplate.update({
			where: { id },
			data: body
		})

		return NextResponse.json(updated)
	} catch (error) {
		console.error('Error updating resource template:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

// DELETE /api/custom-resource-types/:id
export async function DELETE(
	request: NextRequest,
	{ params }: { params: any }
) {
	try {
		const resolvedParams = params && typeof params.then === 'function' ? await params : params
		const id = resolvedParams?.id
		await prisma.resourceTemplate.delete({ where: { id } })
		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Error deleting resource template:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

