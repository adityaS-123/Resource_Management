const { PrismaClient } = require('@prisma/client')

async function checkMigration() {
  const prisma = new PrismaClient()
  
  try {
    console.log('✅ Testing ResourceTemplate access...')
    const templates = await prisma.resourceTemplate.findMany()
    console.log(`Found ${templates.length} resource templates`)
    
    console.log('\n✅ Testing ResourceField access...')
    const fields = await prisma.resourceField.findMany()
    console.log(`Found ${fields.length} resource fields`)
    
    console.log('\n✅ Testing Resource with new schema...')
    const resources = await prisma.resource.findMany()
    console.log(`Found ${resources.length} resources`)
    
    console.log('\n✅ Migration successful! All new models are accessible.')
    
    if (templates.length > 0) {
      console.log('\nTemplate names:')
      templates.forEach(t => console.log(`- ${t.name}`))
    }
    
  } catch (error) {
    console.error('❌ Migration check failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkMigration()