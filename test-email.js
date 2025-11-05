import { sendResourceRequestNotification, testEmailConnection } from './src/lib/email.js'

async function testEmailNotification() {
  console.log('🧪 Testing email notification system...')
  
  // Test connection first
  console.log('\n1. Testing email connection...')
  const connectionResult = await testEmailConnection()
  if (!connectionResult.success) {
    console.error('❌ Email connection failed:', connectionResult.error)
    return
  }
  console.log('✅ Email connection successful')

  // Test resource request notification
  console.log('\n2. Testing resource request notification email...')
  
  const testData = {
    requestId: 'test-123',
    userEmail: 'test.user@example.com',
    userName: 'Test User',
    projectName: 'Sample Project',
    client: 'ACME Corp',
    phaseName: 'Development Phase',
    resourceType: 'Virtual Machine',
    resourceName: 'Standard VM Template',
    requestedQuantity: 2,
    requestedConfig: {
      cpu: '4 cores',
      ram: '8GB',
      storage: '100GB SSD'
    },
    justification: 'Need additional VMs for load testing',
    status: 'PENDING',
    isAutoApproved: false,
    requestUrl: 'http://localhost:3000/admin/requests'
  }

  const emailResult = await sendResourceRequestNotification('alerts4@amnex.com', testData)
  
  if (emailResult.success) {
    console.log('✅ Test email sent successfully! Message ID:', emailResult.messageId)
  } else {
    console.error('❌ Test email failed:', emailResult.error)
  }

  // Test auto-approved notification
  console.log('\n3. Testing auto-approved notification email...')
  
  const autoApprovedData = {
    ...testData,
    requestId: 'test-124',
    status: 'APPROVED',
    isAutoApproved: true,
    justification: 'Project-specific resource allocation'
  }

  const autoEmailResult = await sendResourceRequestNotification('alerts4@amnex.com', autoApprovedData)
  
  if (autoEmailResult.success) {
    console.log('✅ Auto-approved test email sent successfully! Message ID:', autoEmailResult.messageId)
  } else {
    console.error('❌ Auto-approved test email failed:', autoEmailResult.error)
  }

  console.log('\n🎉 Email testing complete!')
}

testEmailNotification().catch(console.error)