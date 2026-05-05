import { createClient } from '@/lib/supabase/server'
import { getRoleFromAppMetadata } from '@/lib/auth/claims'
import { getPostAuthRedirect } from '@/lib/auth/redirect'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      const next = getPostAuthRedirect(
        searchParams.get('next'),
        getRoleFromAppMetadata(data.user.app_metadata),
      )

      return NextResponse.redirect(new URL(next, origin))
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth_failed', origin))
}
