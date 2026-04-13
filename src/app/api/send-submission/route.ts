import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { CheckItem } from '@/lib/types'

// Build a plain-text summary of checklist items
function buildChecklistSummary(items: CheckItem[]): string {
  return items
    .map((item) => {
      const v = item.value ?? null
      const symbol = v === 'yes' ? '✅' : v === 'no' ? '❌' : '⬜'
      return `  ${symbol} ${item.label}`
    })
    .join('\n')
}

// Build an HTML table for checklist items
function buildChecklistHtml(items: CheckItem[]): string {
  const rows = items
    .map((item) => {
      const v = item.value ?? null
      const badge =
        v === 'yes'
          ? '<span style="color:#16a34a;font-weight:bold;">✅ Yes</span>'
          : v === 'no'
          ? '<span style="color:#dc2626;font-weight:bold;">❌ No</span>'
          : '<span style="color:#9ca3af;">— Not checked</span>'
      return `<tr>
        <td style="padding:6px 12px;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151;">${item.label}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #f3f4f6;white-space:nowrap;">${badge}</td>
      </tr>`
    })
    .join('')
  return `<table style="width:100%;border-collapse:collapse;margin-bottom:16px;">${rows}</table>`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, siteItems, machineItems, comment, submittedAt } = body

    const host = process.env.EMAIL_HOST
    const port = Number(process.env.EMAIL_PORT ?? 587)
    const user = process.env.EMAIL_USER
    const pass = process.env.EMAIL_PASS
    const from = process.env.EMAIL_FROM ?? user
    const to   = process.env.ADMIN_EMAIL

    if (!host || !user || !pass || !to) {
      console.warn('[send-submission] Email env vars not configured. Skipping email.')
      return NextResponse.json({ ok: true, skipped: true })
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    })

    const subject = `New Safety Checklist Submission — ${name} (${submittedAt})`

    const text = [
      `New Daily Safety Checklist submitted`,
      ``,
      `Submitted by: ${name}`,
      `Date/Time:    ${submittedAt}`,
      ``,
      `── SITE INDUCTION & SAFETY ──`,
      buildChecklistSummary(siteItems ?? []),
      ``,
      `── MACHINE DAILY CHECKS ──`,
      buildChecklistSummary(machineItems ?? []),
      ``,
      comment ? `Comment / Fault Description:\n  ${comment}` : '',
    ]
      .filter((l) => l !== undefined)
      .join('\n')

    const html = `
<div style="font-family:sans-serif;max-width:640px;margin:auto;background:#f9fafb;padding:24px;border-radius:8px;">
  <h2 style="color:#111827;margin-top:0;">📋 New Safety Checklist Submission</h2>
  <p style="color:#6b7280;font-size:14px;">Submitted by <strong style="color:#111827;">${name}</strong> on ${submittedAt}</p>

  <div style="background:#fff;border:1px solid #e5e7eb;border-radius:6px;padding:16px;margin-bottom:16px;">
    <h3 style="margin-top:0;color:#374151;font-size:15px;">Site Induction &amp; Safety</h3>
    ${buildChecklistHtml(siteItems ?? [])}
  </div>

  <div style="background:#fff;border:1px solid #e5e7eb;border-radius:6px;padding:16px;margin-bottom:16px;">
    <h3 style="margin-top:0;color:#374151;font-size:15px;">Machine Daily Checks</h3>
    ${buildChecklistHtml(machineItems ?? [])}
  </div>

  ${
    comment
      ? `<div style="background:#fff;border:1px solid #e5e7eb;border-radius:6px;padding:16px;">
          <h3 style="margin-top:0;color:#374151;font-size:15px;">Comment / Fault Description</h3>
          <p style="color:#374151;font-size:14px;white-space:pre-wrap;">${comment}</p>
        </div>`
      : ''
  }
</div>`

    await transporter.sendMail({ from, to, subject, text, html })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[send-submission] Error:', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 200 })
  }
}
