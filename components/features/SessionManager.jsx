'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import { Clock, LogOut } from 'lucide-react';

const IDLE_TIMEOUT = 15 * 60 * 1000;
const WARNING_BEFORE = 60 * 1000;

const EVENTS = [
  'mousedown',
  'mousemove',
  'keydown',
  'scroll',
  'touchstart',
  'click',
];

export default function SessionManager() {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const idleTimerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const countdownRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push('/login');
  }, [router]);

  const startWarningCountdown = useCallback(() => {
    const warningSeconds = WARNING_BEFORE / 1000;
    setRemainingSeconds(warningSeconds);

    countdownRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          signOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [signOut]);

  const clearAllTimers = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  const resetIdleTimer = useCallback(() => {
    clearAllTimers();
    setShowWarning(false);
    lastActivityRef.current = Date.now();

    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      startWarningCountdown();
    }, IDLE_TIMEOUT - WARNING_BEFORE);

    idleTimerRef.current = setTimeout(() => {
      signOut();
    }, IDLE_TIMEOUT);
  }, [clearAllTimers, startWarningCountdown, signOut]);

  useEffect(() => {
    resetIdleTimer();

    const handleActivity = () => {
      if (!showWarning) {
        resetIdleTimer();
      }
    };

    EVENTS.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      clearAllTimers();
      EVENTS.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [resetIdleTimer, clearAllTimers, showWarning]);

  const handleStayLoggedIn = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    resetIdleTimer();
  };

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-sm bg-parchment p-6 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brass-light/20">
            <Clock className="h-5 w-5 text-brass" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">
              Session Expiring
            </h2>
            <p className="font-body text-sm text-ink-muted">
              You&apos;ve been inactive for a while.
            </p>
          </div>
        </div>

        <p className="mt-4 font-body text-sm text-ink-muted">
          Your session will expire in{' '}
          <span className="font-medium text-brick">
            {remainingSeconds} second{remainingSeconds !== 1 ? 's' : ''}
          </span>
          . You&apos;ll be signed out automatically.
        </p>

        <div className="mt-6 flex gap-3">
          <Button
            variant="secondary"
            onClick={signOut}
            className="flex-1"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
          <Button
            variant="primary"
            onClick={handleStayLoggedIn}
            className="flex-1"
          >
            Stay logged in
          </Button>
        </div>
      </div>
    </div>
  );
}
