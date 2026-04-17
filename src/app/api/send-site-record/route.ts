import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { SiteRecordRow } from '@/lib/types'
import { buildActionUrl } from '@/app/api/action/route'

const MATERIAL_LABELS: Record<string, string> = {
  'A':     'Asphalt',
  'CON':   'Concrete',
  'R-CON': 'Reinforced Concrete',
  'LMC':   'Lean Mix Concrete',
  'LS':    'Limestone',
  'SS':    'Sandstone',
  'RCK':   'Rock',
  'CH':    'Chalk',
}

function buildRowsHtml(rows: SiteRecordRow[]): string {
  if (!rows || rows.length === 0) return '<p style="color:#6b7280;font-size:14px;">No work entries recorded.</p>'

  const headerCells = ['Date', 'Description', 'Width (MM)', 'Depth (MM)', 'Length (LM)', 'Shift', 'HRS', 'Picks']
    .map(h => `<th style="padding:6px 10px;background:#f9fafb;border-bottom:2px solid #e5e7eb;text-align:left;font-size:12px;color:#6b7280;white-space:nowrap;">${h}</th>`)
    .join('')

  const dataRows = rows.map((row, i) => {
    const bg = i % 2 === 0 ? '#fff' : '#f9fafb'
    return `<tr style="background:${bg};">
      <td style="padding:6px 10px;font-size:13px;color:#374151;white-space:nowrap;">${row.date || '—'}</td>
      <td style="padding:6px 10px;font-size:13px;color:#374151;">${row.description || '—'}</td>
      <td style="padding:6px 10px;font-size:13px;color:#374151;text-align:right;">${row.width || '—'}</td>
      <td style="padding:6px 10px;font-size:13px;color:#374151;text-align:right;">${row.depth || '—'}</td>
      <td style="padding:6px 10px;font-size:13px;color:#374151;text-align:right;">${row.length || '—'}</td>
      <td style="padding:6px 10px;font-size:13px;color:#374151;text-align:center;">${row.shift || '—'}</td>
      <td style="padding:6px 10px;font-size:13px;color:#374151;text-align:right;">${row.hrs || '—'}</td>
      <td style="padding:6px 10px;font-size:13px;color:#374151;text-align:right;">${row.picks || '—'}</td>
    </tr>`
  }).join('')

  return `<div style="overflow-x:auto;">
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead><tr>${headerCells}</tr></thead>
      <tbody>${dataRows}</tbody>
    </table>
  </div>`
}

function buildRowsText(rows: SiteRecordRow[]): string {
  if (!rows || rows.length === 0) return '  No work entries recorded.'
  return rows.map((row, i) =>
    `  Entry ${i + 1}: ${row.date || '—'} | ${row.description || '—'} | ${row.width || '—'}mm x ${row.depth || '—'}mm x ${row.length || '—'}lm | ${row.shift || '—'} shift | ${row.hrs || '—'} hrs | ${row.picks || '—'} picks`
  ).join('\n')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      submissionId, customer, machineType, siteAddress, machineCode,
      rows, materials, worksAgreedBy, capacity,
      signedPresence, presenceSig, ajgRepName, ajgRepSig, submittedAt,
    } = body

    const host = process.env.EMAIL_HOST
    const port = Number(process.env.EMAIL_PORT ?? 587)
    const user = process.env.EMAIL_USER
    const pass = process.env.EMAIL_PASS
    const from = process.env.EMAIL_FROM ?? user
    const to   = process.env.ADMIN_EMAIL

    if (!host || !user || !pass || !to) {
      console.warn('[send-site-record] Email env vars not configured. Skipping email.')
      return NextResponse.json({ ok: true, skipped: true })
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    })

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? `https://${req.headers.get('host')}`
    const approveUrl = submissionId ? buildActionUrl(baseUrl, submissionId, 'approve', 'site_record') : null
    const rejectUrl  = submissionId ? buildActionUrl(baseUrl, submissionId, 'reject',  'site_record') : null

    const subject = `AJ Gammond | Site Record Sheet — ${customer} (${submittedAt})`

    const materialNames = (materials as string[] ?? [])
      .map((code: string) => `${code} (${MATERIAL_LABELS[code] ?? code})`)
      .join(', ')

    const text = [
      `AJ Gammond — Site Record Sheet`,
      `New submission received`,
      ``,
      `Customer:     ${customer}`,
      `Date/Time:    ${submittedAt}`,
      siteAddress  ? `Site Address: ${siteAddress}`  : '',
      machineType  ? `Machine Type: ${machineType}`  : '',
      machineCode  ? `Machine Code: ${machineCode}`  : '',
      ``,
      `── WORK ENTRIES ──`,
      buildRowsText(rows ?? []),
      ``,
      materialNames ? `── MATERIALS ──\n  ${materialNames}` : '',
      ``,
      `── SIGN-OFF ──`,
      worksAgreedBy  ? `Works Agreed By:  ${worksAgreedBy}`                 : '',
      capacity       ? `Capacity:         ${capacity}`                       : '',
      signedPresence ? `Signed in Presence of AJG Rep: ${signedPresence}`   : '',
      ajgRepSig      ? `AJG Rep Signature: ${ajgRepSig}`                    : '',
    ]
      .filter((l) => l !== undefined)
      .join('\n')

    const html = `
<div style="font-family:sans-serif;max-width:680px;margin:auto;background:#f9fafb;padding:24px;border-radius:8px;">
  <h2 style="color:#111827;margin-top:0;">📋 AJ Gammond — Site Record Sheet</h2>
  <p style="color:#6b7280;font-size:14px;">New submission from <strong style="color:#111827;">${customer}</strong> on ${submittedAt}</p>

  <div style="background:#fff;border:1px solid #e5e7eb;border-radius:6px;padding:16px;margin-bottom:16px;">
    <h3 style="margin-top:0;color:#374151;font-size:15px;">Job Details</h3>
    <table style="width:100%;border-collapse:collapse;">
      ${customer    ? `<tr><td style="padding:4px 0;font-size:14px;color:#6b7280;width:160px;">Customer</td><td style="padding:4px 0;font-size:14px;color:#111827;font-weight:600;">${customer}</td></tr>` : ''}
      ${siteAddress ? `<tr><td style="padding:4px 0;font-size:14px;color:#6b7280;">Site Address</td><td style="padding:4px 0;font-size:14px;color:#111827;font-weight:600;">${siteAddress}</td></tr>` : ''}
      ${machineType ? `<tr><td style="padding:4px 0;font-size:14px;color:#6b7280;">Machine Type</td><td style="padding:4px 0;font-size:14px;color:#111827;font-weight:600;">${machineType}</td></tr>` : ''}
      ${machineCode ? `<tr><td style="padding:4px 0;font-size:14px;color:#6b7280;">Machine Code</td><td style="padding:4px 0;font-size:14px;color:#111827;font-weight:600;">${machineCode}</td></tr>` : ''}
    </table>
  </div>

  <div style="background:#fff;border:1px solid #e5e7eb;border-radius:6px;padding:16px;margin-bottom:16px;">
    <h3 style="margin-top:0;color:#374151;font-size:15px;">Work Entries</h3>
    ${buildRowsHtml(rows ?? [])}
  </div>

  ${(materials as string[] ?? []).length > 0 ? `
  <div style="background:#fff;border:1px solid #e5e7eb;border-radius:6px;padding:16px;margin-bottom:16px;">
    <h3 style="margin-top:0;color:#374151;font-size:15px;">Materials</h3>
    <div style="display:flex;flex-wrap:wrap;gap:8px;">
      ${(materials as string[]).map((code: string) => `
        <span style="background:#1B4332;color:#fff;padding:4px 10px;border-radius:6px;font-size:13px;font-weight:600;">
          ${code} — ${MATERIAL_LABELS[code] ?? code}
        </span>`).join('')}
    </div>
  </div>` : ''}

  <div style="background:#fff;border:1px solid #e5e7eb;border-radius:6px;padding:16px;">
    <h3 style="margin-top:0;color:#374151;font-size:15px;">Sign-off Declaration</h3>
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
      ${worksAgreedBy ? `<tr><td style="padding:4px 0;font-size:14px;color:#6b7280;width:220px;">Works Agreed By</td><td style="padding:4px 0;font-size:14px;color:#111827;font-weight:600;">${worksAgreedBy}</td></tr>` : ''}
      ${capacity      ? `<tr><td style="padding:4px 0;font-size:14px;color:#6b7280;">In the Capacity of</td><td style="padding:4px 0;font-size:14px;color:#111827;">${capacity}</td></tr>` : ''}
    </table>
    <!-- Two name + signature pairs side-by-side. Left column aligns to bottom
         so its signature lines up with the right column's (which has Name +
         Signature and ends lower). -->
    <table style="width:100%;border-collapse:separate;border-spacing:16px 0;padding-top:12px;border-top:1px solid #f3f4f6;">
      <tr>
        <td style="width:50%;vertical-align:bottom;">
          <p style="margin:0 0 6px 0;font-size:14px;color:#6b7280;">Signed in Presence of AJG Rep (Client)</p>
          ${presenceSig && (presenceSig as string).startsWith('data:image')
            ? `<img src="${presenceSig}" alt="Client Signature" style="display:block;max-height:80px;max-width:280px;border-bottom:1px solid #d1d5db;padding-bottom:4px;" />`
            : `<p style="margin:0;color:#9ca3af;font-size:14px;">—</p>`}
        </td>
        <td style="width:50%;vertical-align:top;">
          <p style="margin:0 0 8px 0;font-size:14px;color:#6b7280;">Signed by AJG Representative</p>
          <p style="margin:0;font-size:10px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;">Name</p>
          <p style="margin:0 0 10px 0;font-size:15px;color:#111827;font-weight:600;">${ajgRepName || '—'}</p>
          <p style="margin:0;font-size:10px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;">Signature</p>
          ${ajgRepSig
            ? ((ajgRepSig as string).startsWith('data:image')
                ? `<img src="${ajgRepSig}" alt="AJG Rep Signature" style="display:block;max-height:80px;max-width:280px;border-bottom:1px solid #d1d5db;padding-bottom:4px;margin-top:4px;" />`
                : `<p style="margin:4px 0 0 0;color:#111827;font-family:Georgia,serif;font-style:italic;font-size:18px;border-bottom:1px solid #d1d5db;padding-bottom:4px;display:inline-block;min-width:200px;">${ajgRepSig}</p>`)
            : `<p style="margin:4px 0 0 0;color:#9ca3af;font-size:14px;">—</p>`
          }
        </td>
      </tr>
    </table>
  </div>
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
    console.error('[send-site-record] Error:', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 200 })
  }
}
