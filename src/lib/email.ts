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
  status: 'PENDING'
  requestUrl: string
}

// Interface for approval notification email data
interface ApprovalNotificationData {
  requestId: string
  status: 'APPROVED' | 'REJECTED' | 'PENDING_APPROVAL' | 'ASSIGNED_TO_IT'
  approverName?: string
  approverLevel?: number
  requiredLevel?: number
  comments?: string
  resourceType: string
  projectName: string
  userEmail?: string
  userName?: string
  requestedConfig?: any
  requestedQuantity?: number
  justification?: string
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
    subject: `🔔 New Resource Request - ${data.projectName}`,
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
          .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .request-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
          .config-item { background: #f1f3f4; padding: 8px 12px; margin: 5px 0; border-radius: 4px; font-size: 14px; }
          .status-badge { display: inline-block; padding: 6px 12px; border-radius: 4px; font-weight: bold; color: white; background: #f59e0b; }
          .btn { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .btn:hover { background: #2563eb; }
          .footer { text-align: center; color: #666; margin-top: 30px; font-size: 14px; }
          .urgent { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 New Resource Request</h1>
            <p>A new resource request requires your review</p>
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
            
            <div class="urgent">
              <h4>⏰ Action Required</h4>
              <p>This resource request requires approval. Please review the request details and approve or reject as appropriate.</p>
            </div>
            
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

NEW RESOURCE REQUEST

Request Details:
- ID: ${data.requestId}
- Status: ${data.status}
- Requested by: ${data.userName} (${data.userEmail})
- Project: ${data.projectName}${data.client ? ` - ${data.client}` : ''}
- Phase: ${data.phaseName}
- Resource: ${data.resourceName || data.resourceType}
- Quantity: ${data.requestedQuantity}
${data.justification ? `- Justification: ${data.justification}` : ''}

Configuration:
${Object.entries(data.requestedConfig).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

This request requires approval. Please review at: ${data.requestUrl}

Request submitted on ${new Date().toLocaleDateString()}
    `
  }),

  approvalNotification: (data: ApprovalNotificationData) => ({
    subject: `${
      data.status === 'APPROVED' ? '✅ Request Approved' :
      data.status === 'REJECTED' ? '❌ Request Rejected' :
      data.status === 'PENDING_APPROVAL' ? '🔔 Approval Required' :
      '📋 Task Assigned'
    } - ${data.projectName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Approval Notification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { 
            background: ${
              data.status === 'APPROVED' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' :
              data.status === 'REJECTED' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' :
              data.status === 'PENDING_APPROVAL' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' :
              'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
            }; 
            color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; 
          }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .request-info { 
            background: white; padding: 20px; border-radius: 8px; margin: 20px 0; 
            border-left: 4px solid ${
              data.status === 'APPROVED' ? '#10b981' :
              data.status === 'REJECTED' ? '#ef4444' :
              data.status === 'PENDING_APPROVAL' ? '#f59e0b' :
              '#3b82f6'
            }; 
          }
          .config-item { background: #f1f3f4; padding: 8px 12px; margin: 5px 0; border-radius: 4px; font-size: 14px; }
          .status-badge { 
            display: inline-block; padding: 6px 12px; border-radius: 4px; font-weight: bold; color: white; 
            background: ${
              data.status === 'APPROVED' ? '#10b981' :
              data.status === 'REJECTED' ? '#ef4444' :
              data.status === 'PENDING_APPROVAL' ? '#f59e0b' :
              '#3b82f6'
            }; 
          }
          .btn { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .btn:hover { background: #2563eb; }
          .footer { text-align: center; color: #666; margin-top: 30px; font-size: 14px; }
          .action-required { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${
              data.status === 'APPROVED' ? '✅ Request Approved' :
              data.status === 'REJECTED' ? '❌ Request Rejected' :
              data.status === 'PENDING_APPROVAL' ? '🔔 Approval Required' :
              '📋 Task Assigned to IT Team'
            }</h1>
            <p>${
              data.status === 'APPROVED' ? 'Your resource request has been approved!' :
              data.status === 'REJECTED' ? 'Your resource request has been rejected' :
              data.status === 'PENDING_APPROVAL' ? `Level ${data.requiredLevel} approval is required` :
              'A new task has been assigned to the IT team'
            }</p>
          </div>
          
          <div class="content">
            <div class="request-info">
              <h2>📋 Request Details</h2>
              <p><strong>Request ID:</strong> ${data.requestId}</p>
              <p><strong>Status:</strong> <span class="status-badge">${data.status.replace('_', ' ')}</span></p>
              <p><strong>Resource Type:</strong> ${data.resourceType}</p>
              <p><strong>Project:</strong> ${data.projectName}</p>
              ${data.userEmail ? `<p><strong>Requested by:</strong> ${data.userName || data.userEmail} (${data.userEmail})</p>` : ''}
              ${data.requestedQuantity ? `<p><strong>Quantity:</strong> ${data.requestedQuantity}</p>` : ''}
              ${data.approverName ? `<p><strong>Approved by:</strong> ${data.approverName} (Level ${data.approverLevel})</p>` : ''}
            </div>

            ${data.requestedConfig && Object.keys(data.requestedConfig).length > 0 ? `
              <div class="request-info">
                <h3>⚙️ Resource Configuration</h3>
                ${Object.entries(data.requestedConfig).map(([key, value]) => `
                  <div class="config-item">
                    <strong>${key.replace(/([A-Z])/g, ' $1').toLowerCase()}:</strong> ${value}
                  </div>
                `).join('')}
              </div>
            ` : ''}

            ${data.justification ? `
              <div class="request-info">
                <h3>💬 Justification</h3>
                <p>${data.justification}</p>
              </div>
            ` : ''}

            ${data.comments ? `
              <div class="request-info">
                <h3>💬 ${data.status === 'REJECTED' ? 'Rejection Reason' : 'Comments'}</h3>
                <p>${data.comments}</p>
              </div>
            ` : ''}

            ${data.status === 'PENDING_APPROVAL' ? `
              <div class="action-required">
                <h4>⏰ Action Required</h4>
                <p>This resource request requires Level ${data.requiredLevel} approval. Please review and approve or reject as appropriate.</p>
              </div>
            ` : ''}

            ${data.status === 'ASSIGNED_TO_IT' ? `
              <div class="action-required">
                <h4>🔧 IT Task Assignment</h4>
                <p>Please provision the requested resource and provide the necessary details/credentials to the user.</p>
              </div>
            ` : ''}

            ${data.status === 'APPROVED' ? `
              <div class="request-info">
                <h4>✅ Next Steps</h4>
                <p>Your request has been approved and assigned to the IT team for provisioning. You will receive the resource details and credentials once ready.</p>
              </div>
            ` : ''}
            
            <div class="footer">
              <p>Resource Management System - Approval Notification</p>
              <p>Notification sent on ${new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
${
  data.status === 'APPROVED' ? 'RESOURCE REQUEST APPROVED' :
  data.status === 'REJECTED' ? 'RESOURCE REQUEST REJECTED' :
  data.status === 'PENDING_APPROVAL' ? 'APPROVAL REQUIRED' :
  'TASK ASSIGNED TO IT TEAM'
}

Request Details:
- ID: ${data.requestId}
- Status: ${data.status.replace('_', ' ')}
- Resource: ${data.resourceType}
- Project: ${data.projectName}
${data.userEmail ? `- Requested by: ${data.userName || data.userEmail} (${data.userEmail})` : ''}
${data.requestedQuantity ? `- Quantity: ${data.requestedQuantity}` : ''}
${data.approverName ? `- Approved by: ${data.approverName} (Level ${data.approverLevel})` : ''}

${data.requestedConfig && Object.keys(data.requestedConfig).length > 0 ? `
Configuration:
${Object.entries(data.requestedConfig).map(([key, value]) => `- ${key}: ${value}`).join('\n')}
` : ''}

${data.justification ? `Justification: ${data.justification}` : ''}
${data.comments ? `${data.status === 'REJECTED' ? 'Rejection Reason' : 'Comments'}: ${data.comments}` : ''}

${
  data.status === 'APPROVED' ? 'Your request has been approved and assigned to the IT team for provisioning.' :
  data.status === 'REJECTED' ? 'Please review the rejection reason and submit a new request if needed.' :
  data.status === 'PENDING_APPROVAL' ? `This request requires Level ${data.requiredLevel} approval.` :
  'Please provision the requested resource and provide details to the user.'
}

Notification sent on ${new Date().toLocaleDateString()}
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

// New function for approval notifications
export async function sendApprovalNotification(to: string, templateData: ApprovalNotificationData) {
  try {
    const template = emailTemplates.approvalNotification(templateData)
    
    const mailOptions = {
      from: `"Resource Management System" <${emailConfig.auth.user}>`,
      to,
      subject: template.subject,
      html: template.html,
      text: template.text
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Approval notification sent successfully:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Failed to send approval notification:', error)
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

// Interface for task completion notification email data
interface TaskCompletionNotificationData {
  requestId: string
  userEmail: string
  userName: string
  projectName: string
  phaseName: string
  resourceType: string
  completionNotes: string
  credentials: Array<{
    label: string
    value: string
    type: string
  }>
  completedBy: string
  requestUrl: string
}

// New function for task completion notifications
export async function sendTaskCompletionNotification(to: string, data: TaskCompletionNotificationData) {
  try {
    const subject = `🎉 Resource Request Completed - ${data.resourceType} for ${data.projectName}`
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">✅ Resource Request Completed!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Your resource is ready to use</p>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="margin-bottom: 25px;">
            <h2 style="color: #374151; margin-bottom: 15px; font-size: 18px;">Request Details</h2>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
              <p style="margin: 5px 0;"><strong>Project:</strong> ${data.projectName}</p>
              <p style="margin: 5px 0;"><strong>Phase:</strong> ${data.phaseName}</p>
              <p style="margin: 5px 0;"><strong>Resource Type:</strong> ${data.resourceType}</p>
              <p style="margin: 5px 0;"><strong>Request ID:</strong> ${data.requestId}</p>
              <p style="margin: 5px 0;"><strong>Completed by:</strong> ${data.completedBy}</p>
            </div>
          </div>

          <div style="margin-bottom: 25px;">
            <h3 style="color: #374151; margin-bottom: 10px;">Completion Notes</h3>
            <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 0 6px 6px 0;">
              <p style="margin: 0; line-height: 1.6;">${data.completionNotes}</p>
            </div>
          </div>

          ${data.credentials && data.credentials.length > 0 ? `
          <div style="margin-bottom: 25px;">
            <h3 style="color: #374151; margin-bottom: 15px;">🔐 Access Credentials</h3>
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
              <p style="margin: 0 0 10px 0; color: #92400e; font-weight: bold;">⚠️ Important: Keep these credentials secure</p>
              <p style="margin: 0; color: #92400e; font-size: 14px;">Please store these credentials safely and do not share them with unauthorized users.</p>
            </div>
            <div style="background-color: #f9fafb; border: 1px solid #d1d5db; border-radius: 6px; overflow: hidden;">
              ${data.credentials.map(cred => `
                <div style="padding: 12px 15px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-weight: 600; color: #374151;">${cred.label}:</span>
                  <span style="font-family: 'Courier New', monospace; background-color: #f3f4f6; padding: 4px 8px; border-radius: 4px; color: #1f2937;">${cred.type === 'password' ? '••••••••' : cred.value}</span>
                </div>
              `).join('')}
            </div>
            ${data.credentials.some(cred => cred.type === 'password') ? `
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #6b7280;">
                * Passwords are hidden for security. Check your secure communication channel for full credentials.
              </p>
            ` : ''}
          </div>
          ` : ''}

          <div style="text-align: center; margin-top: 30px;">
            <a href="${data.requestUrl}" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              View Request Details
            </a>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280;">
            <p style="margin: 0;">Need help? Contact the IT team or system administrator.</p>
            <p style="margin: 5px 0 0 0;">This is an automated message from the Resource Management System.</p>
          </div>
        </div>
      </div>
    `

    const text = `
Resource Request Completed!

Your resource request has been completed and is ready to use.

Request Details:
- Project: ${data.projectName}
- Phase: ${data.phaseName}
- Resource Type: ${data.resourceType}
- Request ID: ${data.requestId}
- Completed by: ${data.completedBy}

Completion Notes:
${data.completionNotes}

${data.credentials && data.credentials.length > 0 ? `
Access Credentials:
${data.credentials.map(cred => `${cred.label}: ${cred.type === 'password' ? '[Hidden for security]' : cred.value}`).join('\n')}

⚠️ Important: Keep these credentials secure and do not share them with unauthorized users.
` : ''}

View full details: ${data.requestUrl}

Need help? Contact the IT team or system administrator.
This is an automated message from the Resource Management System.
    `

    const mailOptions = {
      from: `"Resource Management System" <${emailConfig.auth.user}>`,
      to,
      subject,
      html,
      text
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Task completion notification sent successfully:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Failed to send task completion notification:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
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