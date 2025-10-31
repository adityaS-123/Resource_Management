import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Resource Templates:')
  const templates = await prisma.resourceTemplate.findMany({
    include: { fields: true }
  })
  console.log(JSON.stringify(templates, null, 2))
  
  console.log('\nMigrated Resources:')
  const resources = await prisma.resource.findMany({
    include: { resourceTemplate: true }
  })
  console.log(JSON.stringify(resources, null, 2))
  
  console.log('\nMigrated ResourceRequests:')
  const resourceRequests = await prisma.resourceRequest.findMany({
    include: { resourceTemplate: true }
  })
  console.log(JSON.stringify(resourceRequests, null, 2))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })