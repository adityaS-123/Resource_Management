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
      userRole: 'ADMIN',
    },
  })

  // Create departments
  const departments = await Promise.all([
    prisma.department.upsert({
      where: { name: 'Engineering' },
      update: {},
      create: {
        name: 'Engineering',
        description: 'Software engineering and development team'
      }
    }),
    prisma.department.upsert({
      where: { name: 'Operations' },
      update: {},
      create: {
        name: 'Operations',
        description: 'IT operations and infrastructure team'
      }
    }),
    prisma.department.upsert({
      where: { name: 'Finance' },
      update: {},
      create: {
        name: 'Finance',
        description: 'Financial planning and budgeting team'
      }
    }),
    prisma.department.upsert({
      where: { name: 'Human Resources' },
      update: {},
      create: {
        name: 'Human Resources',
        description: 'HR and employee management team'
      }
    }),
  ])

  // Create department heads for each department
  const engineeringHeadPassword = await bcrypt.hash('DeptHead@123', 12)
  const engineeringHead = await prisma.user.upsert({
    where: { email: 'alice.johnson@example.com' },
    update: {},
    create: {
      email: 'alice.johnson@example.com',
      name: 'Alice Johnson',
      password: engineeringHeadPassword,
      role: 'USER',
      userRole: 'DEPARTMENT_HEAD',
      departmentId: departments[0].id, // Engineering
    },
  })

  // Link department to head
  await prisma.department.update({
    where: { id: departments[0].id },
    data: { headId: engineeringHead.id }
  })

  const operationsHeadPassword = await bcrypt.hash('DeptHead@123', 12)
  const operationsHead = await prisma.user.upsert({
    where: { email: 'bob.smith@example.com' },
    update: {},
    create: {
      email: 'bob.smith@example.com',
      name: 'Bob Smith',
      password: operationsHeadPassword,
      role: 'USER',
      userRole: 'DEPARTMENT_HEAD',
      departmentId: departments[1].id, // Operations
    },
  })

  await prisma.department.update({
    where: { id: departments[1].id },
    data: { headId: operationsHead.id }
  })

  const financeHeadPassword = await bcrypt.hash('DeptHead@123', 12)
  const financeHead = await prisma.user.upsert({
    where: { email: 'carol.white@example.com' },
    update: {},
    create: {
      email: 'carol.white@example.com',
      name: 'Carol White',
      password: financeHeadPassword,
      role: 'USER',
      userRole: 'DEPARTMENT_HEAD',
      departmentId: departments[2].id, // Finance
    },
  })

  await prisma.department.update({
    where: { id: departments[2].id },
    data: { headId: financeHead.id }
  })

  const hrHeadPassword = await bcrypt.hash('DeptHead@123', 12)
  const hrHead = await prisma.user.upsert({
    where: { email: 'diana.brown@example.com' },
    update: {},
    create: {
      email: 'diana.brown@example.com',
      name: 'Diana Brown',
      password: hrHeadPassword,
      role: 'USER',
      userRole: 'DEPARTMENT_HEAD',
      departmentId: departments[3].id, // Human Resources
    },
  })

  await prisma.department.update({
    where: { id: departments[3].id },
    data: { headId: hrHead.id }
  })

  // Deprecated: Create legacy department head (kept for backward compatibility)
  const deptHeadPassword = await bcrypt.hash('dept123', 12)
  const deptHead = await prisma.user.upsert({
    where: { email: 'dept.head@example.com' },
    update: {},
    create: {
      email: 'dept.head@example.com',
      name: 'Legacy Department Head',
      password: deptHeadPassword,
      role: 'USER',
      userRole: 'DEPARTMENT_HEAD',
      departmentId: departments[0].id, // Assign to Engineering
    },
  })

  // Create IT head
  const itHeadPassword = await bcrypt.hash('ithead123', 12)
  const itHead = await prisma.user.upsert({
    where: { email: 'it.head@example.com' },
    update: {},
    create: {
      email: 'it.head@example.com',
      name: 'Bob Smith',
      password: itHeadPassword,
      role: 'USER',
      userRole: 'IT_HEAD',
    },
  })

  // Create IT team members
  const itPassword = await bcrypt.hash('it123', 12)
  const itTeam1 = await prisma.user.upsert({
    where: { email: 'it.support@example.com' },
    update: {},
    create: {
      email: 'it.support@example.com',
      name: 'Chris Wilson',
      password: itPassword,
      role: 'USER',
      userRole: 'IT_TEAM',
    },
  })

  const itTeam2 = await prisma.user.upsert({
    where: { email: 'it.ops@example.com' },
    update: {},
    create: {
      email: 'it.ops@example.com',
      name: 'Dana Martinez',
      password: itPassword,
      role: 'USER',
      userRole: 'IT_TEAM',
    },
  })

  // Create regular users (assign to Operations department)
  const userPassword = await bcrypt.hash('user123', 12)
  const user1 = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      email: 'john@example.com',
      name: 'John Developer',
      password: userPassword,
      role: 'USER',
      userRole: 'REGULAR_USER',
      departmentId: departments[1].id, // Operations
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
      userRole: 'REGULAR_USER',
      departmentId: departments[1].id, // Operations
    },
  })

  const user3 = await prisma.user.upsert({
    where: { email: 'mike@example.com' },
    update: {},
    create: {
      email: 'mike@example.com',
      name: 'Mike Tester',
      password: userPassword,
      role: 'USER',
      userRole: 'REGULAR_USER',
      departmentId: departments[1].id, // Operations
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
        connect: [
          { id: user1.id }, 
          { id: user2.id }, 
          { id: user3.id },
          { id: deptHead.id },
          { id: itHead.id }
        ]
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

  // Create Resource Templates with different approval levels
  const basicVmTemplate = await prisma.resourceTemplate.upsert({
    where: { name: 'Basic Virtual Machine' },
    update: {},
    create: {
      name: 'Basic Virtual Machine',
      description: 'Standard development VM with basic specifications',
      approvalLevels: 0, // Auto-approved
      isActive: true,
      fields: {
        create: [
          {
            name: 'cpuCores',
            label: 'CPU Cores',
            fieldType: 'NUMBER',
            isRequired: true,
            defaultValue: '2'
          },
          {
            name: 'ramGB',
            label: 'RAM (GB)',
            fieldType: 'NUMBER',
            isRequired: true,
            defaultValue: '4'
          },
          {
            name: 'diskGB',
            label: 'Disk Space (GB)',
            fieldType: 'NUMBER',
            isRequired: true,
            defaultValue: '100'
          },
          {
            name: 'os',
            label: 'Operating System',
            fieldType: 'SELECT',
            isRequired: true,
            defaultValue: 'Ubuntu 20.04',
            options: JSON.stringify(['Ubuntu 20.04', 'Ubuntu 22.04', 'CentOS 8', 'Windows Server 2019'])
          }
        ]
      }
    }
  })

  const standardVmTemplate = await prisma.resourceTemplate.upsert({
    where: { name: 'Standard Virtual Machine' },
    update: {},
    create: {
      name: 'Standard Virtual Machine',
      description: 'Higher spec VM requiring department head approval',
      approvalLevels: 1, // Department head approval
      isActive: true,
      fields: {
        create: [
          {
            name: 'cpuCores',
            label: 'CPU Cores',
            fieldType: 'NUMBER',
            isRequired: true,
            defaultValue: '8'
          },
          {
            name: 'ramGB',
            label: 'RAM (GB)',
            fieldType: 'NUMBER',
            isRequired: true,
            defaultValue: '16'
          },
          {
            name: 'diskGB',
            label: 'Disk Space (GB)',
            fieldType: 'NUMBER',
            isRequired: true,
            defaultValue: '500'
          },
          {
            name: 'os',
            label: 'Operating System',
            fieldType: 'SELECT',
            isRequired: true,
            defaultValue: 'Ubuntu 22.04',
            options: JSON.stringify(['Ubuntu 20.04', 'Ubuntu 22.04', 'CentOS 8', 'Windows Server 2019'])
          }
        ]
      }
    }
  })

  const premiumVmTemplate = await prisma.resourceTemplate.upsert({
    where: { name: 'Premium Virtual Machine' },
    update: {},
    create: {
      name: 'Premium Virtual Machine',
      description: 'High-performance VM requiring IT head approval',
      approvalLevels: 2, // Department head + IT head approval
      isActive: true,
      fields: {
        create: [
          {
            name: 'cpuCores',
            label: 'CPU Cores',
            fieldType: 'NUMBER',
            isRequired: true,
            defaultValue: '16'
          },
          {
            name: 'ramGB',
            label: 'RAM (GB)',
            fieldType: 'NUMBER',
            isRequired: true,
            defaultValue: '32'
          },
          {
            name: 'diskGB',
            label: 'Disk Space (GB)',
            fieldType: 'NUMBER',
            isRequired: true,
            defaultValue: '1000'
          },
          {
            name: 'os',
            label: 'Operating System',
            fieldType: 'SELECT',
            isRequired: true,
            defaultValue: 'Ubuntu 22.04',
            options: JSON.stringify(['Ubuntu 20.04', 'Ubuntu 22.04', 'CentOS 8', 'Windows Server 2019'])
          },
          {
            name: 'gpuEnabled',
            label: 'GPU Enabled',
            fieldType: 'BOOLEAN',
            isRequired: false,
            defaultValue: 'true'
          }
        ]
      }
    }
  })

  const enterpriseServerTemplate = await prisma.resourceTemplate.upsert({
    where: { name: 'Enterprise Server' },
    update: {},
    create: {
      name: 'Enterprise Server',
      description: 'Mission-critical server requiring full admin approval',
      approvalLevels: 3, // Department head + IT head + Admin approval
      isActive: true,
      fields: {
        create: [
          {
            name: 'cpuCores',
            label: 'CPU Cores',
            fieldType: 'NUMBER',
            isRequired: true,
            defaultValue: '32'
          },
          {
            name: 'ramGB',
            label: 'RAM (GB)',
            fieldType: 'NUMBER',
            isRequired: true,
            defaultValue: '64'
          },
          {
            name: 'diskGB',
            label: 'Disk Space (GB)',
            fieldType: 'NUMBER',
            isRequired: true,
            defaultValue: '2000'
          },
          {
            name: 'os',
            label: 'Operating System',
            fieldType: 'SELECT',
            isRequired: true,
            defaultValue: 'Red Hat Enterprise Linux',
            options: JSON.stringify(['Red Hat Enterprise Linux', 'Ubuntu 22.04', 'Windows Server 2022'])
          },
          {
            name: 'backup',
            label: 'Backup Enabled',
            fieldType: 'BOOLEAN',
            isRequired: true,
            defaultValue: 'true'
          },
          {
            name: 'monitoring',
            label: 'Monitoring Enabled',
            fieldType: 'BOOLEAN',
            isRequired: true,
            defaultValue: 'true'
          },
          {
            name: 'highAvailability',
            label: 'High Availability',
            fieldType: 'BOOLEAN',
            isRequired: true,
            defaultValue: 'true'
          }
        ]
      }
    }
  })

  const databaseTemplate = await prisma.resourceTemplate.upsert({
    where: { name: 'Database Server' },
    update: {},
    create: {
      name: 'Database Server',
      description: 'Database server requiring IT head approval',
      approvalLevels: 2, // Department head + IT head approval
      isActive: true,
      fields: {
        create: [
          {
            name: 'engine',
            label: 'Database Engine',
            fieldType: 'SELECT',
            isRequired: true,
            defaultValue: 'PostgreSQL',
            options: JSON.stringify(['PostgreSQL', 'MySQL', 'MongoDB', 'Redis'])
          },
          {
            name: 'version',
            label: 'Version',
            fieldType: 'TEXT',
            isRequired: true,
            defaultValue: '14'
          },
          {
            name: 'storageGB',
            label: 'Storage (GB)',
            fieldType: 'NUMBER',
            isRequired: true,
            defaultValue: '500'
          },
          {
            name: 'connections',
            label: 'Max Connections',
            fieldType: 'NUMBER',
            isRequired: true,
            defaultValue: '100'
          },
          {
            name: 'backup',
            label: 'Backup Enabled',
            fieldType: 'BOOLEAN',
            isRequired: true,
            defaultValue: 'true'
          }
        ]
      }
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

  // Create sample resource requests with different approval levels
  const basicVmRequest = await prisma.resourceRequest.create({
    data: {
      userId: user1.id,
      phaseId: devPhase.id,
      resourceTemplateId: basicVmTemplate.id,
      requestedConfig: JSON.stringify({
        cpuCores: 2,
        ramGB: 4,
        diskGB: 100,
        os: 'Ubuntu 20.04'
      }),
      requestedQty: 1,
      justification: 'Need basic VM for development testing',
      status: 'APPROVED', // Auto-approved (Level 0)
      currentLevel: 0,
      requiredLevels: 0,
      approvedAt: new Date()
    }
  })

  const standardVmRequest = await prisma.resourceRequest.create({
    data: {
      userId: user2.id,
      phaseId: devPhase.id,
      resourceTemplateId: standardVmTemplate.id,
      requestedConfig: JSON.stringify({
        cpuCores: 8,
        ramGB: 16,
        diskGB: 500,
        os: 'Ubuntu 22.04'
      }),
      requestedQty: 1,
      justification: 'Need standard VM for application development',
      status: 'IN_PROGRESS', // Requires Level 1 approval
      currentLevel: 0,
      requiredLevels: 1
    }
  })

  const premiumVmRequest = await prisma.resourceRequest.create({
    data: {
      userId: user3.id,
      phaseId: testPhase.id,
      resourceTemplateId: premiumVmTemplate.id,
      requestedConfig: JSON.stringify({
        cpuCores: 16,
        ramGB: 32,
        diskGB: 1000,
        os: 'Ubuntu 22.04',
        gpuEnabled: true
      }),
      requestedQty: 1,
      justification: 'Need high-performance VM for machine learning model training',
      status: 'IN_PROGRESS', // Requires Level 2 approval
      currentLevel: 1, // Department head approved, waiting for IT head
      requiredLevels: 2
    }
  })

  const enterpriseServerRequest = await prisma.resourceRequest.create({
    data: {
      userId: user1.id,
      phaseId: prodPhase.id,
      resourceTemplateId: enterpriseServerTemplate.id,
      requestedConfig: JSON.stringify({
        cpuCores: 32,
        ramGB: 64,
        diskGB: 2000,
        os: 'Red Hat Enterprise Linux',
        backup: true,
        monitoring: true,
        highAvailability: true
      }),
      requestedQty: 1,
      justification: 'Mission-critical production server for e-commerce platform',
      status: 'IN_PROGRESS', // Requires Level 3 approval
      currentLevel: 0,
      requiredLevels: 3
    }
  })

  const databaseRequest = await prisma.resourceRequest.create({
    data: {
      userId: user2.id,
      phaseId: prodPhase.id,
      resourceTemplateId: databaseTemplate.id,
      requestedConfig: JSON.stringify({
        engine: 'PostgreSQL',
        version: '14',
        storageGB: 1000,
        connections: 200,
        backup: true
      }),
      requestedQty: 1,
      justification: 'Production database server for e-commerce application',
      status: 'REJECTED',
      currentLevel: 0,
      requiredLevels: 2,
      rejectionReason: 'Insufficient budget allocation for this quarter'
    }
  })

  // Create some approval records for the requests that are in progress
  
  // Standard VM request - Pending approval at Level 1 (Department Head)
  await prisma.approvalRecord.create({
    data: {
      resourceRequestId: standardVmRequest.id,
      approvalLevel: 1,
      approverId: deptHead.id,
      status: 'PENDING',
      comments: null
    }
  })

  // Enterprise Server request - Pending approval at Level 1 (Department Head)
  await prisma.approvalRecord.create({
    data: {
      resourceRequestId: enterpriseServerRequest.id,
      approvalLevel: 1,
      approverId: deptHead.id,
      status: 'PENDING',
      comments: null
    }
  })

  // Premium VM request - Already approved at Level 1, now needs Level 2 (IT Head)
  await prisma.approvalRecord.create({
    data: {
      resourceRequestId: premiumVmRequest.id,
      approvalLevel: 1,
      approverId: deptHead.id,
      status: 'APPROVED',
      comments: 'Approved for ML training purposes',
      approvedAt: new Date()
    }
  })

  // Premium VM request - Pending approval at Level 2 (IT Head)
  await prisma.approvalRecord.create({
    data: {
      resourceRequestId: premiumVmRequest.id,
      approvalLevel: 2,
      approverId: itHead.id,
      status: 'PENDING',
      comments: null
    }
  })

  console.log('Database seeded successfully!')
  console.log('')
  console.log('=== Departments Created ===')
  console.log('- Engineering (Head: Alice Johnson - alice.johnson@example.com)')
  console.log('- Operations (Head: Bob Smith - bob.smith@example.com)')
  console.log('- Finance (Head: Carol White - carol.white@example.com)')
  console.log('- Human Resources (Head: Diana Brown - diana.brown@example.com)')
  console.log('')
  console.log('=== User Accounts Created ===')
  console.log('Admin: admin@example.com / admin123 (ADMIN)')
  console.log('Engineering Head: alice.johnson@example.com / DeptHead@123 (DEPARTMENT_HEAD)')
  console.log('Operations Head: bob.smith@example.com / DeptHead@123 (DEPARTMENT_HEAD)')
  console.log('Finance Head: carol.white@example.com / DeptHead@123 (DEPARTMENT_HEAD)')
  console.log('HR Head: diana.brown@example.com / DeptHead@123 (DEPARTMENT_HEAD)')
  console.log('Legacy Dept Head: dept.head@example.com / dept123 (DEPARTMENT_HEAD)')
  console.log('IT Head: it.head@example.com / ithead123 (IT_HEAD)')
  console.log('IT Support: it.support@example.com / it123 (IT_TEAM)')
  console.log('IT Operations: it.ops@example.com / it123 (IT_TEAM)')
  console.log('Developer: john@example.com / user123 (REGULAR_USER)')
  console.log('Designer: jane@example.com / user123 (REGULAR_USER)')
  console.log('Tester: mike@example.com / user123 (REGULAR_USER)')
  console.log('')
  console.log('=== Resource Templates Created ===')
  console.log('- Basic Virtual Machine (Level 0 - Auto-approved)')
  console.log('- Standard Virtual Machine (Level 1 - Department Head)')
  console.log('- Premium Virtual Machine (Level 2 - Department Head + IT Head)')
  console.log('- Enterprise Server (Level 3 - Department Head + IT Head + Admin)')
  console.log('- Database Server (Level 2 - Department Head + IT Head)')
  console.log('')
  console.log('=== Sample Resource Requests Created ===')
  console.log('- Basic VM: APPROVED (Auto-approved)')
  console.log('- Standard VM: IN_PROGRESS (Awaiting Level 1)')
  console.log('- Premium VM: IN_PROGRESS (Level 1 approved, awaiting Level 2)')
  console.log('- Enterprise Server: IN_PROGRESS (Awaiting Level 1)')
  console.log('- Database Server: REJECTED (Insufficient budget)')
  console.log('')
  console.log('Visit /test-approvals to test the approval workflow!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })