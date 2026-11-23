import {
  CheckSquare,
  Database,
  FileText,
  Image as ImageIcon,
  KeyRound,
  ShieldCheck,
  Ticket,
  Users,
  type LucideIcon,
} from 'lucide-react'

/** Presentation only: an icon per list key, with a neutral fallback for lists added later. */
const BY_KEY: Record<string, LucideIcon> = {
  Todo: CheckSquare,
  User: Users,
  Role: ShieldCheck,
  TodoImage: ImageIcon,
  OAuthApp: KeyRound,
  OAuthToken: Ticket,
  Post: FileText,
}

export function listIcon(key: string): LucideIcon {
  if (BY_KEY[key]) return BY_KEY[key]
  if (/image|photo|media|file/i.test(key)) return ImageIcon
  if (/user|person|people|member/i.test(key)) return Users
  if (/role|permission/i.test(key)) return ShieldCheck
  return Database
}
