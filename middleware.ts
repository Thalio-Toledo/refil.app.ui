import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const auth = req.headers.get('authorization')

  if (!auth) {
    return new Response('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Protected"',
      },
    })
  }

  const [, encoded] = auth.split(' ')
  const decoded = atob(encoded)
  const [user, pass] = decoded.split(':')

  if (
    user === process.env.BASIC_AUTH_USER &&
    pass === process.env.BASIC_AUTH_PASSWORD
  ) {
    return NextResponse.next()
  }

  return new Response('Unauthorized', { status: 401 })
}