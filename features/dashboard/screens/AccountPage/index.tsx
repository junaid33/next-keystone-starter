/**
 * AccountPage - Server Component
 * The signed-in person's own User record, edited through the same item form (Keystone access
 * control already lets people read and edit themselves), plus appearance and session.
 */

import { notFound, redirect } from 'next/navigation'
import { getAuthenticatedUser, getAdminMetaAction, getItemValidationAction } from '../../actions'
import { getItemAction } from '../../actions/getItemAction'
import { getListByPath } from '../../actions/getListByPath'
import { ItemPageClient } from '../ItemPage/ItemPageClient'
import { AccountExtras } from './AccountExtras'

export async function AccountPage() {
  const userResponse = await getAuthenticatedUser()
  const me = userResponse.success ? userResponse.data?.authenticatedItem : null
  if (!me?.id) redirect('/dashboard/signin')

  const list = await getListByPath('users')
  if (!list) notFound()

  const [itemResponse, adminMetaResponse, validationResponse] = await Promise.all([
    getItemAction(list, me.id, {}, { next: { tags: [`item-${list.key}-${me.id}`], revalidate: 3600 } }),
    getAdminMetaAction(list.key),
    getItemValidationAction(list.key, me.id),
  ])

  const item = itemResponse.success ? (itemResponse.data.item as Record<string, unknown>) : {}
  const accountList = adminMetaResponse.success ? adminMetaResponse.data.list : list

  if (validationResponse.success && accountList.fields) {
    Object.keys(accountList.fields).forEach((fieldPath) => {
      const validation = validationResponse.data?.[fieldPath]
      if (validation && accountList.fields[fieldPath]) {
        accountList.fields[fieldPath].itemView = { ...accountList.fields[fieldPath].itemView, ...validation }
      }
    })
  }

  return (
    <ItemPageClient
      list={{ ...accountList, hideDelete: true }}
      item={item}
      itemId={me.id}
      crumbs={[
        { type: 'link', label: 'Overview', href: '/dashboard' },
        { type: 'page', label: 'Account' },
      ]}
      footer={<AccountExtras />}
    />
  )
}

export default AccountPage
