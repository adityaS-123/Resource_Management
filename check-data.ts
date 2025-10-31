import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Existing Resources:')
  const resources = await prisma.resource.findMany()
  console.log(JSON.stringify(resources, null, 2))
  
  console.log('\nExisting ResourceRequests:')
  const resourceRequests = await prisma.resourceRequest.findMany()
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