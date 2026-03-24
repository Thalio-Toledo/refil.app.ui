declare const process: {
  env: {
    BASIC_AUTH_USER: string
    BASIC_AUTH_PASSWORD: string
  }
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
    // ✅ NÃO RETORNE NADA
    // isso libera o acesso aos arquivos Angular
    return
  }

  return new Response('Unauthorized', { status: 401 })
}