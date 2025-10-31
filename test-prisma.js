const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testResourceTemplates() {
  try {
    console.log('Testing Prisma client...')
    
    // Test if resourceTemplate exists
    const templates = await prisma.resourceTemplate.findMany({
      include: { fields: true }
    })
    
    console.log('✅ resourceTemplate model exists!')
    console.log('Found templates:', templates.length)
    
    if (templates.length > 0) {
      console.log('First template:', JSON.stringify(templates[0], null, 2))
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testResourceTemplates()