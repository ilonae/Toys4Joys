/**
 * Brevo (formerly Sendinblue) transactional email helper.
 * Uses their REST API directly — no SDK dependency.
 *
 * Free plan: 300 emails/day, custom domain sending after DNS verification.
 * Docs: https://developers.brevo.com/reference/sendtransacemail
 */

export interface SendEmailParams {
  to:        string
  subject:   string
  html:      string
  fromName?: string
  fromEmail?: string
}

export async function sendEmail({
  to,
  subject,
  html,
  fromName  = 'TOYS4JOYS',
  fromEmail = 'bestellungen@toys4joys.de',
}: SendEmailParams): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) {
    console.error('[brevo] BREVO_API_KEY not set')
    return { ok: false, error: 'BREVO_API_KEY not configured' }
  }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      sender:      { name: fromName, email: fromEmail },
      to:          [{ email: to }],
      subject,
      htmlContent: html,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => 'unknown error')
    console.error('[brevo] send failed:', res.status, text)
    return { ok: false, error: `${res.status}: ${text}` }
  }

  return { ok: true }
}
