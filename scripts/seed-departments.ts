// Script to seed departments
// Run with: npx tsx scripts/seed-departments.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding departments...')

  const departments = [
    {
      name: 'Engineering',
      description: 'Software Development & Engineering'
    },
    {
      name: 'Operations',
      description: 'Operations and Infrastructure'
    },
    {
      name: 'Finance',
      description: 'Finance and Accounting'
    },
    {
      name: 'Human Resources',
      description: 'Human Resources and Administration'
    },
    {
      name: 'Sales',
      description: 'Sales and Business Development'
    },
    {
      name: 'Marketing',
      description: 'Marketing and Communications'
    }
  ]

  for (const dept of departments) {
    const existing = await prisma.department.findUnique({
      where: { name: dept.name }
    })

    if (!existing) {
      const created = await prisma.department.create({
        data: dept
      })
      console.log(`Created department: ${created.name}`)
    } else {
      console.log(`Department already exists: ${dept.name}`)
    }
  }

  console.log('Department seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
