import { list } from '@keystone-6/core'
import { allOperations, denyAll } from '@keystone-6/core/access'
import { checkbox, password, relationship, text } from '@keystone-6/core/fields'

import { isSignedIn, permissions, rules } from './access'
import type { Session } from './access'
import type { Lists } from '.keystone/types'

import { User } from './models/User'
import { Role } from './models/Role'
import { Todo } from './models/Todo'

export const lists: Lists<Session> = {
  Todo,
  User,
  Role,
} satisfies Lists<Session>