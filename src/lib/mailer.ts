import nodemailer from 'nodemailer'

export function getEmailTransporter() {
  const user = process.env.SMTP_USER || 'msunagpur@gmail.com'
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD

  if (!pass) {
    return null
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass,
    },
  })
}

export async function sendCertificateEmail({
  to,
  studentName,
  certificateNumber,
  verificationUrl,
  score,
  totalQuestions,
}: {
  to: string
  studentName: string
  certificateNumber: string
  verificationUrl: string
  score: number
  totalQuestions: number
}) {
  const transporter = getEmailTransporter()
  const senderEmail = process.env.SMTP_USER || 'msunagpur@gmail.com'

  if (!transporter) {
    console.warn('Gmail SMTP credentials not configured. Please set GMAIL_APP_PASSWORD in environment variables.')
    return { success: false, reason: 'SMTP not configured' }
  }

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
      <div style="background-color: #1e3a8a; color: #fff; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 22px;">World AMR Awareness Week 2026</h1>
        <p style="margin: 5px 0 0; font-size: 14px; opacity: 0.9;">Metropolitan Surveillance Unit Nagpur</p>
      </div>

      <div style="padding: 24px;">
        <p style="font-size: 16px;">Dear <b>${studentName}</b>,</p>
        <p>Congratulations on completing the <b>AMR National Online Quiz Competition</b>!</p>

        <div style="background-color: #f8fafc; border-left: 4px solid #1e3a8a; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0 0 8px;"><b>Certificate ID:</b> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${certificateNumber}</code></p>
          <p style="margin: 0 0 8px;"><b>Score Secured:</b> ${score} / ${totalQuestions}</p>
          <p style="margin: 0;"><b>Sender:</b> ${senderEmail}</p>
        </div>

        <p>Your digital Certificate of Participation / Merit has been generated and verified.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #1e3a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            View & Verify Official Certificate
          </a>
        </div>

        <p style="font-size: 13px; color: #64748b;">
          Or copy-paste this verification link in your browser:<br/>
          <a href="${verificationUrl}" style="color: #2563eb;">${verificationUrl}</a>
        </p>
      </div>

      <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
        Sent officially from <b>${senderEmail}</b><br/>
        Metropolitan Surveillance Unit (MSU), Nagpur
      </div>
    </div>
  `

  const info = await transporter.sendMail({
    from: `"MSU Nagpur - AMR Quiz Portal" <${senderEmail}>`,
    to,
    subject: `Your Official Certificate - AMR Quiz Competition (${certificateNumber})`,
    html: htmlContent,
  })

  return { success: true, messageId: info.messageId }
}
