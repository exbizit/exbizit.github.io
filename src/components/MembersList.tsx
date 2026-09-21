interface MembersListProps {
  members: { name: string; role?: string }[]
  accentColor: string
}

export default function MembersList({ members, accentColor }: MembersListProps) {
  return (
    <ul className="space-y-2">
      {members.map((m, i) => (
        <li key={i} className="flex items-baseline gap-2 font-mono text-sm">
          <span style={{ color: accentColor }} aria-hidden>—</span>
          <span style={{ color: 'var(--bone)' }}>{m.name}</span>
          {m.role && (
            <span className="text-xs" style={{ color: 'var(--ash)' }}>{m.role}</span>
          )}
        </li>
      ))}
    </ul>
  )
}
