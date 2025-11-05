import nodemailer from 'nodemailer'

// Email configuration
const emailConfig = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: 'i_aditiya@amnex.com',
    pass: 'hkau rady axdj nckc'
  }
}

// Create transporter
const transporter = nodemailer.createTransport(emailConfig)

// Interface for project invitation email data
interface ProjectInvitationData {
  projectName: string
  client: string
  startDate: string
  endDate: string
  phases: Array<{
    name: string
    duration: number
    resources: Array<{
      identifier?: string
      resourceType: string
      quantity: number
      configuration: string
    }>
  }>
  inviteUrl: string
}

// Interface for resource request notification email data
interface ResourceRequestNotificationData {
  requestId: string
  userEmail: string
  userName: string
  projectName: string
  client: string
  phaseName: string
  resourceType: string
  resourceName?: string
  requestedQuantity: number
  requestedConfig: any
  justification?: string
  status: 'PENDING' | 'APPROVED'
  isAutoApproved: boolean
  requestUrl: string
}

// Email templates
export const emailTemplates = {
  projectInvitation: (data: ProjectInvitationData) => ({
    subject: `🎯 You've been invited to project: ${data.projectName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Project Invitation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .project-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
          .phase-card { background: white; margin: 15px 0; padding: 15px; border-radius: 6px; border: 1px solid #e0e0e0; }
          .resource-item { background: #f1f3f4; padding: 10px; margin: 8px 0; border-radius: 4px; font-size: 14px; }
          .btn { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .btn:hover { background: #5a6fd8; }
          .note { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #666; margin-top: 30px; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 Project Invitation</h1>
            <p>You've been invited to collaborate on a new project!</p>
          </div>
          
          <div class="content">
            <div class="project-info">
              <h2>📋 Project Details</h2>
              <p><strong>Project Name:</strong> ${data.projectName}</p>
              <p><strong>Client:</strong> ${data.client}</p>
              <p><strong>Duration:</strong> ${new Date(data.startDate).toLocaleDateString()} - ${new Date(data.endDate).toLocaleDateString()}</p>
            </div>
            
            <h3>🚀 Project Phases & Resources</h3>
            ${data.phases.map(phase => `
              <div class="phase-card">
                <h4>📅 ${phase.name} (${phase.duration} months)</h4>
                ${phase.resources.length > 0 ? `
                  <p><strong>Available Resources:</strong></p>
                  ${phase.resources.map(resource => `
                    <div class="resource-item">
                      <strong>${resource.identifier ? `${resource.identifier} - ` : ''}${resource.resourceType}</strong>
                      <br>Quantity: ${resource.quantity}
                      ${resource.configuration !== '{}' ? `<br>Configuration: ${JSON.parse(resource.configuration).cpu ? `${JSON.parse(resource.configuration).cpu} CPU, ${JSON.parse(resource.configuration).ram}GB RAM` : 'Custom configuration'}` : ''}
                    </div>
                  `).join('')}
                ` : '<p><em>No resources configured yet for this phase.</em></p>'}
              </div>
            `).join('')}
            
            <div class="note">
              <h4>🔐 Getting Started</h4>
              <p>To request additional resources or access project details, you'll need to sign in to the Resource Management System first.</p>
            </div>
            
            <div style="text-align: center;">
              <a href="${data.inviteUrl}" class="btn">🚀 Sign In to Access Project</a>
            </div>
            
            <div class="footer">
              <p>This invitation was sent by the Resource Management System</p>
              <p>If you have any questions, please contact your project administrator.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Project Invitation - ${data.projectName}

You've been invited to collaborate on the project "${data.projectName}" for client ${data.client}.

Project Duration: ${new Date(data.startDate).toLocaleDateString()} - ${new Date(data.endDate).toLocaleDateString()}

Project Phases:
${data.phases.map(phase => `
- ${phase.name} (${phase.duration} months)
  Resources: ${phase.resources.length} configured
`).join('')}

To access this project and request additional resources, please sign in at:
${data.inviteUrl}

Thank you!
    `
  }),

  resourceRequestNotification: (data: ResourceRequestNotificationData) => ({
    subject: `${data.isAutoApproved ? '✅ Resource Auto-Approved' : '🔔 New Resource Request'} - ${data.projectName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Resource Request Notification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${data.isAutoApproved ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'}; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .request-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${data.isAutoApproved ? '#10b981' : '#3b82f6'}; }
          .config-item { background: #f1f3f4; padding: 8px 12px; margin: 5px 0; border-radius: 4px; font-size: 14px; }
          .status-badge { display: inline-block; padding: 6px 12px; border-radius: 4px; font-weight: bold; color: white; background: ${data.isAutoApproved ? '#10b981' : '#f59e0b'}; }
          .btn { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .btn:hover { background: #2563eb; }
          .footer { text-align: center; color: #666; margin-top: 30px; font-size: 14px; }
          .urgent { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${data.isAutoApproved ? '✅ Resource Auto-Approved' : '🔔 New Resource Request'}</h1>
            <p>${data.isAutoApproved ? 'A project resource has been automatically allocated' : 'A new resource request requires your review'}</p>
          </div>
          
          <div class="content">
            <div class="request-info">
              <h2>📋 Request Details</h2>
              <p><strong>Request ID:</strong> ${data.requestId}</p>
              <p><strong>Status:</strong> <span class="status-badge">${data.status}</span></p>
              <p><strong>Requested by:</strong> ${data.userName} (${data.userEmail})</p>
              <p><strong>Project:</strong> ${data.projectName} - ${data.client}</p>
              <p><strong>Phase:</strong> ${data.phaseName}</p>
              <p><strong>Resource Type:</strong> ${data.resourceName || data.resourceType}</p>
              <p><strong>Quantity:</strong> ${data.requestedQuantity}</p>
              ${data.justification ? `<p><strong>Justification:</strong> ${data.justification}</p>` : ''}
            </div>
            
            ${Object.keys(data.requestedConfig).length > 0 ? `
              <div class="request-info">
                <h3>⚙️ Resource Configuration</h3>
                ${Object.entries(data.requestedConfig).map(([key, value]) => `
                  <div class="config-item">
                    <strong>${key.replace(/([A-Z])/g, ' $1').toLowerCase()}:</strong> ${value}
                  </div>
                `).join('')}
              </div>
            ` : ''}
            
            ${!data.isAutoApproved ? `
              <div class="urgent">
                <h4>⏰ Action Required</h4>
                <p>This resource request requires admin approval. Please review the request details and approve or reject as appropriate.</p>
              </div>
            ` : `
              <div class="request-info">
                <h4>ℹ️ Auto-Approval Information</h4>
                <p>This request was automatically approved because it's for a project-specific resource that was already allocated to this project phase.</p>
              </div>
            `}
            
            <div style="text-align: center;">
              <a href="${data.requestUrl}" class="btn">📊 View Request Details</a>
            </div>
            
            <div class="footer">
              <p>Resource Management System - Admin Notification</p>
              <p>Request submitted on ${new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Resource Request Notification

${data.isAutoApproved ? 'RESOURCE AUTO-APPROVED' : 'NEW RESOURCE REQUEST'}

Request Details:
- ID: ${data.requestId}
- Status: ${data.status}
- Requested by: ${data.userName} (${data.userEmail})
- Project: ${data.projectName} - ${data.client}
- Phase: ${data.phaseName}
- Resource: ${data.resourceName || data.resourceType}
- Quantity: ${data.requestedQuantity}
${data.justification ? `- Justification: ${data.justification}` : ''}

Configuration:
${Object.entries(data.requestedConfig).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

${data.isAutoApproved ? 
  'This request was automatically approved for a project-specific resource.' : 
  'This request requires admin approval. Please review at: ' + data.requestUrl
}

Request submitted on ${new Date().toLocaleDateString()}
    `
  })
}

// Send email function
export async function sendEmail(to: string, templateType: 'projectInvitation' | 'resourceRequestNotification', templateData: any) {
  try {
    const template = emailTemplates[templateType](templateData)
    
    const mailOptions = {
      from: `"Resource Management System" <${emailConfig.auth.user}>`,
      to,
      subject: template.subject,
      html: template.html,
      text: template.text
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Email sent successfully:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Failed to send email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Legacy function for backward compatibility
export async function sendProjectInvitationEmail(to: string, templateData: ProjectInvitationData) {
  return sendEmail(to, 'projectInvitation', templateData)
}

// New function for resource request notifications
export async function sendResourceRequestNotification(to: string, templateData: ResourceRequestNotificationData) {
  return sendEmail(to, 'resourceRequestNotification', templateData)
}

// Test email connection
export async function testEmailConnection() {
  try {
    await transporter.verify()
    console.log('Email connection verified successfully')
    return { success: true }
  } catch (error) {
    console.error('Email connection failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}