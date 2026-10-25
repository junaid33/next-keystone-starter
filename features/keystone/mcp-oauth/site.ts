/**
 * MCP OAuth settings for this repo: the only file in mcp-oauth/ that differs
 * between family members. No env vars of its own.
 */

/** Shown as "Connect ChatGPT to …"; null uses the request host. */
export async function siteDisplayName(_context: any): Promise<string | null> {
  return null
}

/** Whether people without an account may create one on the consent screen (must match User create access). */
export function allowAccountCreation(): boolean {
  return process.env.PUBLIC_SIGNUPS_ALLOWED === 'true'
}

/** Staff are people whose role opens the dashboard. */
export function isStaffSession(session: any): boolean {
  return session?.data?.role?.canAccessDashboard === true
}

export function roleLabel(session: any): string {
  return session?.data?.role?.name || (isStaffSession(session) ? 'Staff' : 'Member')
}

/** What the consent screen says the app can do, before scopes narrow it. */
export function capabilityLines(session: any, canWrite: boolean): string[] {
  if (isStaffSession(session)) {
    return canWrite
      ? ['See and change everything your role allows in the dashboard', 'Nothing your role cannot already do']
      : ['See everything your role allows in the dashboard', 'No changes']
  }
  return canWrite
    ? ['See and update your own account and to-dos', 'Nothing your account cannot already do']
    : ['See your own account and to-dos', 'No changes']
}
