import nodemailer from 'nodemailer'
import { env } from '../config/env.js'

function hasSmtpConfig() {
  return Boolean(env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASS && env.SMTP_FROM)
}

export async function sendPasswordResetCode(email: string, code: string) {
  if (!hasSmtpConfig()) {
    console.info(`[password-reset] SMTP not configured. Code for ${email}: ${code}`)
    return
  }

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    }
  })

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: email,
    subject: 'Your ReciTrack password reset code',
    text: `Your ReciTrack password reset code is ${code}. It expires in 10 minutes.`,
    html: `<p>Your ReciTrack password reset code is <strong>${code}</strong>.</p><p>It expires in 10 minutes.</p>`
  })
}
