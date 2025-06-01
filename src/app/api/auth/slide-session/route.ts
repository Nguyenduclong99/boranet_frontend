import authApiRequest from '@/apiRequests/auth'
import { HttpError } from '@/lib/http'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('accessToken')
  if (!accessToken) {
    return Response.json(
      { message: 'Không nhận được session token' },
      {
        status: 401
      }
    )
  }
}
