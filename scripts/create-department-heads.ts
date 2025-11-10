// Script to create department heads for each department
// Run with: npx tsx scripts/create-department-heads.ts

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Creating department heads...')

  const departments = [
    {
      name: 'Engineering',
      headName: 'Michael Chen',
      headEmail: 'michael.chen@example.com',
      headPassword: 'DeptHead@123'
    },
    {
      name: 'Operations',
      headName: 'Sarah Williams',
      headEmail: 'sarah.williams@example.com',
      headPassword: 'DeptHead@123'
    },
    {
      name: 'Finance',
      headName: 'David Martinez',
      headEmail: 'david.martinez@example.com',
      headPassword: 'DeptHead@123'
    },
    {
      name: 'Human Resources',
      headName: 'Emily Johnson',
      headEmail: 'emily.johnson@example.com',
      headPassword: 'DeptHead@123'
    },
    {
      name: 'Sales',
      headName: 'Robert Brown',
      headEmail: 'robert.brown@example.com',
      headPassword: 'DeptHead@123'
    },
    {
      name: 'Marketing',
      headName: 'Jessica Lee',
      headEmail: 'jessica.lee@example.com',
      headPassword: 'DeptHead@123'
    }
  ]

  for (const deptInfo of departments) {
    try {
      // Find the department
      const department = await prisma.department.findUnique({
        where: { name: deptInfo.name }
      })

      if (!department) {
        console.log(`❌ Department not found: ${deptInfo.name}`)
        continue
      }

      // Check if department already has a head
      if (department.headId) {
        console.log(`⚠️  Department already has a head: ${deptInfo.name}`)
        continue
      }

      // Check if head user already exists
      let headUser = await prisma.user.findUnique({
        where: { email: deptInfo.headEmail }
      })

      if (!headUser) {
        // Create the department head user
        const hashedPassword = await bcrypt.hash(deptInfo.headPassword, 12)
        headUser = await prisma.user.create({
          data: {
            name: deptInfo.headName,
            email: deptInfo.headEmail,
            password: hashedPassword,
            role: 'USER',
            userRole: 'DEPARTMENT_HEAD',
            departmentId: department.id
          }
        })
        console.log(`✅ Created department head: ${deptInfo.headName} (${deptInfo.headEmail})`)
      } else {
        console.log(`⚠️  Head user already exists: ${deptInfo.headEmail}`)
      }

      // Assign the head to the department
      const updatedDept = await prisma.department.update({
        where: { id: department.id },
        data: { headId: headUser.id },
        include: {
          head: {
            select: { id: true, name: true, email: true }
          }
        }
      })

      console.log(`✅ Assigned head to department: ${updatedDept.name} → ${updatedDept.head?.name}`)
    } catch (error) {
      console.error(`❌ Error processing department ${deptInfo.name}:`, error)
    }
  }

  console.log('\n📊 Department heads creation complete!')

  // Display summary
  const departmentsWithHeads = await prisma.department.findMany({
    include: {
      head: {
        select: { id: true, name: true, email: true, userRole: true }
      },
      members: {
        select: { id: true, name: true, email: true }
      }
    }
  })

  console.log('\n📋 Department Summary:')
  console.log('─'.repeat(80))
  for (const dept of departmentsWithHeads) {
    console.log(`\n${dept.name}`)
    console.log(`  Head: ${dept.head ? `${dept.head.name} (${dept.head.email})` : 'No head assigned'}`)
    console.log(`  Members: ${dept.members.length} user(s)`)
    if (dept.members.length > 0) {
      dept.members.forEach(member => {
        console.log(`    - ${member.name} (${member.email})`)
      })
    }
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
