declare const process: {
  env: {
    BASIC_AUTH_USER: string
    BASIC_AUTH_PASSWORD: string
  }
}

export const config = {
  matcher: '/:path*', // 🔴 ISSO É O MAIS IMPORTANTE
}

export function middleware(request: Request) {
  const auth = request.headers.get('authorization')

  if (!auth) {
    return new Response('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Protected"',
      },
    })
  }

  const encoded = auth.split(' ')[1]
  const decoded = atob(encoded)
  const [user, pass] = decoded.split(':')

  if (
    user === process.env.BASIC_AUTH_USER &&
    pass === process.env.BASIC_AUTH_PASSWORD
  ) {
    // ✅ acesso liberado
    return
  }

  return new Response('Unauthorized', { status: 401 })
}