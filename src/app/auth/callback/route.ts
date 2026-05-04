import { createClient } from '@/lib/supabase/server'
import { getPostAuthRedirect } from '@/lib/auth/redirect'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .maybeSingle()
      const next = getPostAuthRedirect(searchParams.get('next'), profile?.role)

      return NextResponse.redirect(new URL(next, origin))
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth_failed', origin))
}
