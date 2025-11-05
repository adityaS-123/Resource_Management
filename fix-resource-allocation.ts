import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixResourceAllocation() {
  console.log('🔍 Checking resource allocation consistency...')
  
  try {
    // Get all resources
    const resources = await prisma.resource.findMany()

    console.log(`Found ${resources.length} resources`)

    for (const resource of resources) {
      // Get all approved requests for this specific resource
      const approvedRequests = await prisma.resourceRequest.findMany({
        where: {
          resourceId: resource.id,
          status: 'APPROVED'
        }
      })

      const totalApprovedQty = approvedRequests.reduce((sum, req) => sum + req.requestedQty, 0)
      
      console.log(`\n📦 Resource: ${resource.resourceType} (${resource.identifier || 'No ID'})`)
      console.log(`   Total Quantity: ${resource.quantity}`)
      console.log(`   Current Consumed: ${resource.consumedQuantity}`)
      console.log(`   Calculated from Requests: ${totalApprovedQty}`)
      console.log(`   Approved Requests: ${approvedRequests.length}`)

      if (resource.consumedQuantity !== totalApprovedQty) {
        console.log(`   ⚠️  MISMATCH! Updating consumedQuantity from ${resource.consumedQuantity} to ${totalApprovedQty}`)
        
        await prisma.resource.update({
          where: { id: resource.id },
          data: { consumedQuantity: totalApprovedQty }
        })
        
        console.log(`   ✅ Fixed consumedQuantity`)
      } else {
        console.log(`   ✅ Already consistent`)
      }
    }

    console.log('\n🎉 Resource allocation check complete!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixResourceAllocation()