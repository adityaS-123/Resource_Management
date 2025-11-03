import nodemailer from 'nodemailer'

// Email configuration
const emailConfig = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: 'alerts4@amnex.com',
    pass: 'xyyxjwhxbpxnhrfe'
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
  })
}

// Send email function
export async function sendEmail(to: string, templateData: any) {
  try {
    const template = emailTemplates.projectInvitation(templateData)
    
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