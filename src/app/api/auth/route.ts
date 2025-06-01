export async function POST(request: Request) {
  const body = await request.json()
  const accessToken = body.accessToken as string
  const expiresAt = body.expiresAt as string
  if (!accessToken) {
    return Response.json(
      { message: 'Không nhận được session token' },
      {
        status: 400
      }
    )
  }
  const expiresDate = new Date(expiresAt).toUTCString()
  return Response.json(body, {
    status: 200,
    headers: {
      'Set-Cookie': `accessToken=${accessToken}; Path=/; HttpOnly; Expires=${expiresDate}; SameSite=Lax; Secure`
    }
  })
}
