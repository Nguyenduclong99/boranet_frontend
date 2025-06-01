import envConfig from '@/config'
import { normalizePath } from '@/lib/utils'
import { LoginResType } from '@/schemaValidations/auth.schema'
import { redirect } from 'next/navigation'

type CustomOptions = Omit<RequestInit, 'method'> & {
  baseUrl?: string | undefined
}

const ENTITY_ERROR_STATUS = 422
const AUTHENTICATION_ERROR_STATUS = 401

type EntityErrorPayload = {
  message: string
  errors: {
    field: string
    message: string
  }[]
}

export class HttpError extends Error {
  status: number
  payload: {
    message: string
    [key: string]: any
  }
  constructor({ status, payload }: { status: number; payload: any }) {
    super('Http Error')
    this.status = status
    this.payload = payload
  }
}

export class EntityError extends HttpError {
  status: 422
  payload: EntityErrorPayload
  constructor({
    status,
    payload
  }: {
    status: 422
    payload: EntityErrorPayload
  }) {
    super({ status, payload })
    this.status = status
    this.payload = payload
  }
}

let clientLogoutRequest: null | Promise<any> = null
export const isClient = () => typeof window !== 'undefined'
const request = async <Response>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  options?: CustomOptions | undefined
) => {
  let body: FormData | string | undefined = undefined
  if (options?.body instanceof FormData) {
    body = options.body
  } else if (options?.body) {
    body = JSON.stringify(options.body)
  }
  const baseHeaders: {
    [key: string]: string
  } =
    body instanceof FormData
      ? {}
      : {
          'Content-Type': 'application/json'
        }
  if (isClient()) {
    const accessToken = localStorage.getItem('accessToken')
    if (accessToken) {
      baseHeaders.Authorization = `Bearer ${accessToken}`
    }
  }
  const baseUrl =
    options?.baseUrl === undefined
      ? envConfig.NEXT_PUBLIC_API_ENDPOINT
      : options.baseUrl

  const fullUrl = url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`

  const res = await fetch(fullUrl, {
    ...options,
    headers: {
      ...baseHeaders,
      ...options?.headers
    } as any,
    body,
    method
  })
  const payload: Response = await res.json()
  const data = {
    status: res.status,
    payload
  }
  if (!res.ok) {
    if (res.status === ENTITY_ERROR_STATUS) {
      throw new EntityError(
        data as {
          status: 422
          payload: EntityErrorPayload
        }
      )
    } else if (res.status === AUTHENTICATION_ERROR_STATUS) {
      if (isClient()) {
        if (!clientLogoutRequest) {
          clientLogoutRequest = fetch('/api/auth/logout', {
            method: 'POST',
            body: JSON.stringify({ force: true }),
            headers: {
              ...baseHeaders
            } as any
          })
          try {
            await clientLogoutRequest
          } catch (error) {
          } finally {
            localStorage.removeItem('accessToken')
            localStorage.removeItem('accessTokenExpiresAt')
            clientLogoutRequest = null
            location.href = '/login'
          }
        }
      } else {
        const accessToken = (options?.headers as any)?.Authorization.split(
          'Bearer '
        )[1]
        redirect(`/logout?accessToken=${accessToken}`)
      }
    } else {
      throw new HttpError(data)
    }
  }
  if (isClient()) {
    if (
      ['auth/login', 'auth/register'].some(
        (item) => item === normalizePath(url)
      )
    ) {
      const { token, expiresAt } = (payload as LoginResType).data
      localStorage.setItem('accessToken', token)
      localStorage.setItem('accessTokenExpiresAt', expiresAt)
    } else if ('auth/logout' === normalizePath(url)) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('accessTokenExpiresAt')
    }
  }
  return data
}

const http = {
  get<Response>(
    url: string,
    options?: Omit<CustomOptions, 'body'> | undefined
  ) {
    return request<Response>('GET', url, options)
  },
  post<Response>(
    url: string,
    body: any,
    options?: Omit<CustomOptions, 'body'> | undefined
  ) {
    return request<Response>('POST', url, { ...options, body })
  },
  put<Response>(
    url: string,
    body: any,
    options?: Omit<CustomOptions, 'body'> | undefined
  ) {
    return request<Response>('PUT', url, { ...options, body })
  },
  delete<Response>(
    url: string,
    options?: Omit<CustomOptions, 'body'> | undefined
  ) {
    return request<Response>('DELETE', url, { ...options })
  }
}

export default http
