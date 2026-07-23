import NotificationsBell from './NotificationsBell';

function initials(name) {
  if (!name) return '';
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function MemberTopbar({ userId, fullName }) {
  return (
    <div className="flex items-center justify-end gap-4 border-b border-rule bg-parchment-soft px-6 py-3">
      <NotificationsBell userId={userId} />
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brass-light font-mono text-xs font-semibold text-ink">
          {initials(fullName)}
        </div>
        <span className="hidden font-body text-sm text-ink sm:inline">{fullName}</span>
      </div>
    </div>
  );
}
