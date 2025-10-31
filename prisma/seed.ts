import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'System Admin',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  // Create regular users
  const userPassword = await bcrypt.hash('user123', 12)
  const user1 = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      email: 'john@example.com',
      name: 'John Developer',
      password: userPassword,
      role: 'USER',
    },
  })

  const user2 = await prisma.user.upsert({
    where: { email: 'jane@example.com' },
    update: {},
    create: {
      email: 'jane@example.com',
      name: 'Jane Designer',
      password: userPassword,
      role: 'USER',
    },
  })

  // Create a sample project
  const project = await prisma.project.create({
    data: {
      name: 'E-commerce Platform',
      client: 'TechCorp Inc.',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      createdById: admin.id,
      users: {
        connect: [{ id: user1.id }, { id: user2.id }]
      }
    }
  })

  // Create phases
  const devPhase = await prisma.phase.create({
    data: {
      name: 'Development',
      duration: 6,
      allocatedCost: 50000.0,
      projectId: project.id
    }
  })

  const testPhase = await prisma.phase.create({
    data: {
      name: 'Testing',
      duration: 2,
      allocatedCost: 20000.0,
      projectId: project.id
    }
  })

  const prodPhase = await prisma.phase.create({
    data: {
      name: 'Production',
      duration: 4,
      allocatedCost: 30000.0,
      projectId: project.id
    }
  })

  // Create resources for development phase (using flexible resourceType)
  await prisma.resource.createMany({
    data: [
      {
        resourceType: 'Virtual Machine',
        configuration: JSON.stringify({
          cpuCores: 8,
          ramGB: 16,
          diskGB: 500
        }),
        quantity: 5,
        costPerUnit: 100.0,
        phaseId: devPhase.id
      },
      {
        resourceType: 'Storage',
        configuration: JSON.stringify({
          type: 'SSD',
          diskGB: 1000,
          redundancy: 'RAID-1'
        }),
        quantity: 10,
        costPerUnit: 50.0,
        phaseId: devPhase.id
      }
    ]
  })

  // Create resources for testing phase
  await prisma.resource.createMany({
    data: [
      {
        resourceType: 'Virtual Machine',
        configuration: JSON.stringify({
          cpuCores: 4,
          ramGB: 8,
          diskGB: 250
        }),
        quantity: 3,
        costPerUnit: 75.0,
        phaseId: testPhase.id
      }
    ]
  })

  // Create resources for production phase
  await prisma.resource.createMany({
    data: [
      {
        resourceType: 'Virtual Machine',
        configuration: JSON.stringify({
          cpuCores: 16,
          ramGB: 32,
          diskGB: 1000
        }),
        quantity: 2,
        costPerUnit: 200.0,
        phaseId: prodPhase.id
      },
      {
        resourceType: 'Load Balancer',
        configuration: JSON.stringify({
          cpuCores: 4,
          ramGB: 8,
          diskGB: 100,
          maxConnections: 10000
        }),
        quantity: 2,
        costPerUnit: 150.0,
        phaseId: prodPhase.id
      }
    ]
  })

  // Create sample resource requests
  await prisma.resourceRequest.createMany({
    data: [
      {
        userId: user1.id,
        phaseId: devPhase.id,
        resourceType: 'Virtual Machine',
        requestedConfig: JSON.stringify({
          cpuCores: 4,
          ramGB: 8,
          diskGB: 250
        }),
        requestedQty: 2,
        justification: 'Need VMs for development environment setup',
        status: 'PENDING'
      },
      {
        userId: user2.id,
        phaseId: devPhase.id,
        resourceType: 'Storage',
        requestedConfig: JSON.stringify({
          type: 'SSD',
          diskGB: 500,
          redundancy: 'RAID-1'
        }),
        requestedQty: 3,
        justification: 'Additional storage for design assets and backups',
        status: 'APPROVED',
        approvedById: admin.id,
        approvedAt: new Date()
      }
    ]
  })

  console.log('Database seeded successfully!')
  console.log('Admin user: admin@example.com / admin123')
  console.log('Test users: john@example.com / user123, jane@example.com / user123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })