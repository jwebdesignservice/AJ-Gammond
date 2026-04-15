import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHmac, timingSafeEqual } from 'crypto'

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

function signAction(id: string, action: string, type: string): string {
  const secret = process.env.ACTION_SECRET
  if (!secret) throw new Error('ACTION_SECRET not configured')
  return createHmac('sha256', secret).update(`${id}:${action}:${type}`).digest('hex')
}

export function buildActionUrl(baseUrl: string, id: string, action: string, type: string): string {
  const sig = signAction(id, action, type)
  return `${baseUrl}/api/action?id=${id}&action=${action}&type=${type}&sig=${sig}`
}

function html(title: string, body: string, color: string) {
  return new NextResponse(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${title}</title></head>
    <body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f9fafb;">
      <div style="text-align:center;max-width:400px;padding:32px;">
        <div style="font-size:48px;margin-bottom:16px;">${color}</div>
        <h1 style="color:#111827;margin-bottom:8px;">${title}</h1>
        <p style="color:#6b7280;">${body}</p>
        <p style="margin-top:24px;font-size:13px;color:#9ca3af;">AJ Gammond Ltd</p>
      </div>
    </body></html>`,
    { headers: { 'Content-Type': 'text/html' } }
  )
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id     = searchParams.get('id')
  const action = searchParams.get('action')
  const type   = searchParams.get('type')
  const sig    = searchParams.get('sig')

  if (!id || !action || !type || !sig) {
    return html('Invalid Link', 'This link is missing required parameters.', '⚠️')
  }

  if (!['approve', 'reject'].includes(action)) {
    return html('Invalid Action', 'Unknown action requested.', '⚠️')
  }

  if (!['checklist', 'site_record'].includes(type)) {
    return html('Invalid Type', 'Unknown submission type.', '⚠️')
  }

  // Verify HMAC signature
  try {
    const expected = signAction(id, action, type)
    const expectedBuf = Buffer.from(expected, 'hex')
    const actualBuf   = Buffer.from(sig, 'hex')
    if (expectedBuf.length !== actualBuf.length || !timingSafeEqual(expectedBuf, actualBuf)) {
      return html('Invalid Link', 'This link is invalid or has been tampered with.', '🔒')
    }
  } catch {
    return html('Configuration Error', 'Server is not properly configured.', '⚠️')
  }

  const supabase = createAdminClient()
  const table = type === 'checklist' ? 'submissions' : 'site_records'
  const status = action === 'approve' ? 'approved' : 'rejected'

  const { error } = await supabase
    .from(table)
    .update({ status })
    .eq('id', id)

  if (error) {
    console.error('[action] DB update error:', error)
    return html('Something went wrong', 'Could not update the submission status. Please try again or log in to the admin panel.', '❌')
  }

  if (action === 'approve') {
    return html('Approved', 'The submission has been marked as approved.', '✅')
  } else {
    return html('Rejected', 'The submission has been marked as rejected.', '❌')
  }
}
