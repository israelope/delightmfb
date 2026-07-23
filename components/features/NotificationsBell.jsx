'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell, HandCoins, Wallet, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { timeAgo } from '@/lib/utils';

const TYPE_ICON = { contribution: Wallet, loan: HandCoins, general: Bell };

export default function NotificationsBell({ userId }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const panelRef = useRef(null);

  async function loadNotifications() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('notifications')
      .select('id, title, message, type, is_read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(15);
    setNotifications(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  async function markAllRead() {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    const supabase = createClient();
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  async function markOneRead(id) {
    const supabase = createClient();
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative text-ink-muted hover:text-cooperative"
      >
        <Bell className="h-5 w-5" strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brick px-1 font-mono text-[10px] font-semibold text-parchment-soft">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-sm border border-rule bg-parchment-soft shadow-lg">
          <div className="flex items-center justify-between border-b border-rule px-4 py-3">
            <p className="font-body text-sm font-semibold text-ink">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 font-body text-xs text-cooperative hover:underline"
              >
                <Check className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <p className="px-4 py-6 text-center font-body text-sm text-ink-muted">Loading…</p>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-6 text-center font-body text-sm text-ink-muted">
                Nothing yet — updates from your admin will show up here.
              </p>
            ) : (
              <ul className="divide-y divide-rule">
                {notifications.map((n) => {
                  const Icon = TYPE_ICON[n.type] ?? Bell;
                  return (
                    <li
                      key={n.id}
                      onClick={() => !n.is_read && markOneRead(n.id)}
                      className={`flex cursor-pointer gap-3 px-4 py-3 hover:bg-cooperative/5 ${
                        n.is_read ? '' : 'bg-cooperative/5'
                      }`}
                    >
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cooperative/10">
                        <Icon className="h-3.5 w-3.5 text-cooperative" strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-body text-sm font-medium text-ink">{n.title}</p>
                        <p className="mt-0.5 font-body text-xs leading-relaxed text-ink-muted">
                          {n.message}
                        </p>
                        <p className="mt-1 font-mono text-[11px] text-ink-muted/70">
                          {timeAgo(n.created_at)}
                        </p>
                      </div>
                      {!n.is_read && (
                        <span className="ml-auto mt-1 h-2 w-2 shrink-0 rounded-full bg-brass" />
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
