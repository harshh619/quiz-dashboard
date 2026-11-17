import nodemailer from 'nodemailer'
import { generateCertificatePdfBuffer } from '@/lib/certificatePdf'

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
  collegeName,
  course,
  certificateNumber,
  certificateType = 'participation',
  verificationUrl,
  score,
  totalQuestions = 30,
}: {
  to: string
  studentName: string
  collegeName?: string
  course?: string
  certificateNumber: string
  certificateType?: string
  verificationUrl: string
  score: number
  totalQuestions?: number
}) {
  const transporter = getEmailTransporter()
  const senderEmail = process.env.SMTP_USER || 'msunagpur@gmail.com'

  if (!transporter) {
    console.warn('Gmail SMTP credentials not configured. Please set GMAIL_APP_PASSWORD in environment variables.')
    return { success: false, reason: 'SMTP not configured' }
  }

  // Generate official PDF attachment
  let pdfBuffer: Buffer | null = null
  try {
    pdfBuffer = await generateCertificatePdfBuffer({
      studentName,
      collegeName,
      course,
      certificateNumber,
      certificateType,
      verificationUrl,
      score,
      totalQuestions,
    })
  } catch (pdfErr) {
    console.error('Error generating PDF attachment:', pdfErr)
  }

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
      <div style="background-color: #1e3a8a; color: #fff; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 22px;">World AMR Awareness Week 2026</h1>
        <p style="margin: 5px 0 0; font-size: 14px; opacity: 0.9;">Metropolitan Surveillance Unit Nagpur (NMC)</p>
      </div>

      <div style="padding: 24px;">
        <p style="font-size: 16px;">Dear <b>${studentName}</b>,</p>
        <p>Congratulations on completing the <b>National Online Quiz Competition on Antimicrobial Resistance (AMR)</b>!</p>

        <div style="background-color: #f8fafc; border-left: 4px solid #1e3a8a; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0 0 8px;"><b>Certificate ID:</b> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${certificateNumber}</code></p>
          <p style="margin: 0 0 8px;"><b>Score Secured:</b> ${score} / ${totalQuestions}</p>
          <p style="margin: 0;"><b>Issued by:</b> Metropolitan Surveillance Unit, Nagpur</p>
        </div>

        <p style="color: #15803d; font-weight: bold; background: #f0fdf4; padding: 10px 14px; border-radius: 6px; border: 1px solid #bbf7d0;">
          📎 Your official digital verified certificate is attached to this email as a PDF document.
        </p>

        <div style="text-align: center; margin: 25px 0;">
          <a href="${verificationUrl}" style="background-color: #1e3a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Verify Certificate Online
          </a>
        </div>

        <p style="font-size: 13px; color: #64748b;">
          Online verification link:<br/>
          <a href="${verificationUrl}" style="color: #2563eb;">${verificationUrl}</a>
        </p>
      </div>

      <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
        Sent officially from <b>${senderEmail}</b><br/>
        Metropolitan Surveillance Unit (MSU), Nagpur Municipal Corporation
      </div>
    </div>
  `

  const attachments: Array<{ filename: string; content: Buffer }> = []
  if (pdfBuffer) {
    attachments.push({
      filename: `AMR_Certificate_${certificateNumber}.pdf`,
      content: pdfBuffer,
    })
  }

  const info = await transporter.sendMail({
    from: `"MSU Nagpur - AMR Quiz Portal" <${senderEmail}>`,
    to,
    subject: `Your Official Certificate - AMR Quiz Competition (${certificateNumber})`,
    html: htmlContent,
    attachments,
  })

  return { success: true, messageId: info.messageId }
}
