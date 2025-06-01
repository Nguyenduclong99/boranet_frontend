import http from '@/lib/http'
import {
  AccountResType,
  UpdateMeBodyType
} from '@/schemaValidations/account.schema'

const accountApiRequest = {
  me: (accessToken: string) =>
    http.get<AccountResType>('account/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }),
  meClient: () => http.get<AccountResType>('account/me'),
  updateMe: (body: UpdateMeBodyType) =>
    http.put<AccountResType>('account/me', body)
}

export default accountApiRequest
