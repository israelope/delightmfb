import { cn } from '@/lib/utils';

/**
 * Signature visual motif for Delight MFB: a rotated ink-stamp circle,
 * echoing the rubber stamp a cooperative officer presses into a physical
 * passbook to mark a deposit verified. Used "live" (brass, crisp) once
 * approved, and "waiting" (faded, dashed) while pending.
 */
export default function PassbookStamp({ label = 'VERIFIED', state = 'live', className }) {
  const isLive = state === 'live';
  return (
    <div
      className={cn('-rotate-[9deg] select-none', className)}
      aria-hidden="true"
    >
      <svg viewBox="0 0 160 160" className="h-full w-full">
        <circle
          cx="80"
          cy="80"
          r="72"
          fill="none"
          stroke={isLive ? '#B8862E' : '#B7AE94'}
          strokeWidth="3"
          strokeDasharray={isLive ? '0' : '6 5'}
        />
        <circle
          cx="80"
          cy="80"
          r="60"
          fill="none"
          stroke={isLive ? '#B8862E' : '#B7AE94'}
          strokeWidth="1.5"
        />
        <path
          id="stampCirclePath"
          d="M 80 80 m -68, 0 a 68,68 0 1,1 136,0 a 68,68 0 1,1 -136,0"
          fill="none"
        />
        <text
          fill={isLive ? '#B8862E' : '#B7AE94'}
          className="font-mono text-[13px] font-semibold uppercase tracking-[0.25em]"
        >
          <textPath href="#stampCirclePath" startOffset="2%">
            {label} • DELIGHT MFB •
          </textPath>
        </text>
        <text
          x="80"
          y="88"
          textAnchor="middle"
          fill={isLive ? '#1F4B3F' : '#B7AE94'}
          className="font-display text-[22px] italic"
        >
          {isLive ? 'Est. Trust' : 'Awaiting'}
        </text>
      </svg>
    </div>
  );
}
