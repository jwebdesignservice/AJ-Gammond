import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { CheckItem } from '@/lib/types'
import { buildActionUrl } from '@/app/api/action/route'

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
    const { submissionId, name, contractor, siteAddress, machineType, machineCode, siteItems, machineItems, comment, submittedAt, signature } = body

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

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? `https://${req.headers.get('host')}`
    const approveUrl = submissionId ? buildActionUrl(baseUrl, submissionId, 'approve', 'checklist') : null
    const rejectUrl  = submissionId ? buildActionUrl(baseUrl, submissionId, 'reject',  'checklist') : null

    const subject = `AJ Gammond | Daily Safety & Maintenance Checklist — ${name} (${submittedAt})`

    const text = [
      `AJ Gammond — Daily Safety & Maintenance Checklist`,
      `New submission received`,
      ``,
      `Submitted by: ${name}`,
      `Date/Time:    ${submittedAt}`,
      contractor   ? `Contractor:   ${contractor}`   : '',
      siteAddress  ? `Site Address: ${siteAddress}`  : '',
      machineType  ? `Machine Type: ${machineType}`  : '',
      machineCode  ? `Machine Code: ${machineCode}`  : '',
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
  <h2 style="color:#111827;margin-top:0;">📋 AJ Gammond — Daily Safety &amp; Maintenance Checklist</h2>
  <p style="color:#6b7280;font-size:14px;">New submission from <strong style="color:#111827;">${name}</strong> on ${submittedAt}</p>

  ${(contractor || siteAddress || machineType || machineCode) ? `
  <div style="background:#fff;border:1px solid #e5e7eb;border-radius:6px;padding:16px;margin-bottom:16px;">
    <h3 style="margin-top:0;color:#374151;font-size:15px;">Job Details</h3>
    <table style="width:100%;border-collapse:collapse;">
      ${contractor  ? `<tr><td style="padding:4px 0;font-size:14px;color:#6b7280;width:140px;">Contractor</td><td style="padding:4px 0;font-size:14px;color:#111827;font-weight:600;">${contractor}</td></tr>` : ''}
      ${siteAddress ? `<tr><td style="padding:4px 0;font-size:14px;color:#6b7280;">Site Address</td><td style="padding:4px 0;font-size:14px;color:#111827;font-weight:600;">${siteAddress}</td></tr>` : ''}
      ${machineType ? `<tr><td style="padding:4px 0;font-size:14px;color:#6b7280;">Machine Type</td><td style="padding:4px 0;font-size:14px;color:#111827;font-weight:600;">${machineType}</td></tr>` : ''}
      ${machineCode ? `<tr><td style="padding:4px 0;font-size:14px;color:#6b7280;">Machine Code</td><td style="padding:4px 0;font-size:14px;color:#111827;font-weight:600;">${machineCode}</td></tr>` : ''}
    </table>
  </div>` : ''}

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
      ? `<div style="background:#fff;border:1px solid #e5e7eb;border-radius:6px;padding:16px;margin-bottom:16px;">
          <h3 style="margin-top:0;color:#374151;font-size:15px;">Comment / Fault Description</h3>
          <p style="color:#374151;font-size:14px;white-space:pre-wrap;">${comment}</p>
        </div>`
      : ''
  }

  ${
    signature
      ? `<div style="background:#fff;border:1px solid #e5e7eb;border-radius:6px;padding:16px;">
          <h3 style="margin-top:0;color:#374151;font-size:15px;">Sign-off</h3>
          <p style="color:#6b7280;font-size:14px;margin:4px 0 2px 0;">Name</p>
          <p style="color:#111827;font-size:15px;font-weight:600;margin:0 0 10px 0;">${name}</p>
          <p style="color:#6b7280;font-size:14px;margin:6px 0 4px 0;">Signature</p>
          ${signature.startsWith('data:image')
            ? `<img src="${signature}" alt="Signature" style="display:block;max-height:90px;max-width:320px;border-bottom:1px solid #d1d5db;padding-bottom:4px;" />`
            : `<p style="color:#111827;font-family:Georgia,serif;font-style:italic;font-size:18px;border-bottom:1px solid #d1d5db;padding-bottom:4px;display:inline-block;min-width:200px;">${signature}</p>`
          }
        </div>`
      : ''
  }
</div>`

    const actionButtonsHtml = (approveUrl && rejectUrl) ? `
  <div style="background:#fff;border:1px solid #e5e7eb;border-radius:6px;padding:20px;margin-bottom:16px;text-align:center;">
    <p style="color:#374151;font-size:14px;margin-top:0;margin-bottom:16px;font-weight:600;">Review this submission</p>
    <a href="${approveUrl}" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;margin-right:12px;">✅ Approve</a>
    <a href="${rejectUrl}"  style="display:inline-block;background:#dc2626;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">❌ Reject</a>
  </div>` : ''

    const fullHtml = actionButtonsHtml + html

    await transporter.sendMail({ from, to, subject, text, html: fullHtml })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[send-submission] Error:', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 200 })
  }
}
