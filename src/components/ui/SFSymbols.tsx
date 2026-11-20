import React from 'react';

/**
 * Bespoke minimalist SF Symbols-inspired glyphs.
 * Used strictly per Apple HIG: Tab Bar items, Navigation Bar controls,
 * disclosure chevrons, and core media actions — zero decorative clutter.
 */
interface SymbolProps {
  className?: string;
  filled?: boolean;
}

const base = (className = 'w-5 h-5') => ({
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className,
  'aria-hidden': true,
});

export function SFToday({ className, filled }: SymbolProps) {
  return (
    <svg {...base(className)}>
      <circle cx="12" cy="12" r="4.2" fill={filled ? 'currentColor' : 'none'} />
      <path d="M12 2.75v2M12 19.25v2M4.75 12h-2M21.25 12h-2M5.64 5.64l1.42 1.42M16.94 16.94l1.42 1.42M18.36 5.64l-1.42 1.42M7.06 16.94l-1.42 1.42" />
    </svg>
  );
}

export function SFStudio({ className, filled }: SymbolProps) {
  return (
    <svg {...base(className)}>
      <path
        d="M12 3.5 3.5 8 12 12.5 20.5 8 12 3.5Z"
        fill={filled ? 'currentColor' : 'none'}
      />
      <path d="M3.5 12.5 12 17l8.5-4.5" />
      <path d="M3.5 16.5 12 21l8.5-4.5" />
    </svg>
  );
}

export function SFWheel({ className, filled }: SymbolProps) {
  return (
    <svg {...base(className)}>
      <circle cx="12" cy="12" r="8.5" fill={filled ? 'currentColor' : 'none'} fillOpacity={filled ? 0.18 : 0} />
      <path d="M12 3.5v17M3.5 12h17M6 6l12 12M18 6 6 18" strokeWidth="1.4" />
      <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SFLearn({ className, filled }: SymbolProps) {
  return (
    <svg {...base(className)}>
      <path
        d="M2.5 9.5 12 5l9.5 4.5L12 14 2.5 9.5Z"
        fill={filled ? 'currentColor' : 'none'}
      />
      <path d="M6.5 11.7v4.3c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5v-4.3" />
      <path d="M21 10v5" />
    </svg>
  );
}

export function SFVault({ className, filled }: SymbolProps) {
  return (
    <svg {...base(className)}>
      <rect
        x="4"
        y="4"
        width="4.5"
        height="16"
        rx="1.2"
        fill={filled ? 'currentColor' : 'none'}
      />
      <rect
        x="10.2"
        y="4"
        width="4.5"
        height="16"
        rx="1.2"
        fill={filled ? 'currentColor' : 'none'}
      />
      <path d="M16.8 5.2 20.5 19.2" strokeWidth="2.1" />
    </svg>
  );
}

export function SFCloud({ className, filled }: SymbolProps) {
  return (
    <svg {...base(className)}>
      <path
        d="M7 18.2h10.2a4 4 0 0 0 .5-7.95A5.5 5.5 0 0 0 7.2 8.7 3.8 3.8 0 0 0 7 18.2Z"
        fill={filled ? 'currentColor' : 'none'}
        fillOpacity={filled ? 0.22 : 0}
      />
    </svg>
  );
}

export function SFGear({ className }: SymbolProps) {
  return (
    <svg {...base(className)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.08a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.08a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}

export function SFMoon({ className }: SymbolProps) {
  return (
    <svg {...base(className)}>
      <path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10Z" />
    </svg>
  );
}

export function SFChevronRight({ className = 'w-4 h-4' }: SymbolProps) {
  return (
    <svg {...base(className)}>
      <path d="m9 6 6 6-6 6" strokeWidth="2" />
    </svg>
  );
}

export function SFChevronBack({ className = 'w-4 h-4' }: SymbolProps) {
  return (
    <svg {...base(className)}>
      <path d="m15 6-6 6 6 6" strokeWidth="2.1" />
    </svg>
  );
}

export function SFPlus({ className = 'w-4 h-4' }: SymbolProps) {
  return (
    <svg {...base(className)}>
      <path d="M12 5v14M5 12h14" strokeWidth="2" />
    </svg>
  );
}

export function SFXMark({ className = 'w-3.5 h-3.5' }: SymbolProps) {
  return (
    <svg {...base(className)}>
      <path d="M6 6l12 12M18 6 6 18" strokeWidth="2.1" />
    </svg>
  );
}

export function SFMic({ className = 'w-4 h-4', filled }: SymbolProps) {
  return (
    <svg {...base(className)}>
      <rect x="9" y="3.5" width="6" height="10.5" rx="3" fill={filled ? 'currentColor' : 'none'} />
      <path d="M6 11.5a6 6 0 0 0 12 0M12 17.5v3M9 20.5h6" />
    </svg>
  );
}

export function SFPlay({ className = 'w-4 h-4' }: SymbolProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M7.5 5.4c0-1.1 1.2-1.8 2.1-1.2l10.2 6.6c.8.5.8 1.8 0 2.3l-10.2 6.6c-.9.6-2.1-.1-2.1-1.2V5.4Z" />
    </svg>
  );
}

export function SFPause({ className = 'w-4 h-4' }: SymbolProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <rect x="6.5" y="4.5" width="4" height="15" rx="1.4" />
      <rect x="13.5" y="4.5" width="4" height="15" rx="1.4" />
    </svg>
  );
}

export function SFSearch({ className = 'w-5 h-5' }: SymbolProps) {
  return (
    <svg {...base(className)}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.2 4.2" strokeWidth="2" />
    </svg>
  );
}

export function SFPip({ className = 'w-5 h-5' }: SymbolProps) {
  return (
    <svg {...base(className)}>
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <rect x="11.5" y="11" width="7" height="5.5" rx="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SFHeart({ className, filled }: SymbolProps) {
  return (
    <svg {...base(className)}>
      <path
        d="M12 20s-7.2-4.6-8.6-9.2C2.3 7.2 4.7 4.5 7.7 4.5c1.8 0 3.4 1 4.3 2.4.9-1.4 2.5-2.4 4.3-2.4 3 0 5.4 2.7 4.3 6.3C19.2 15.4 12 20 12 20Z"
        fill={filled ? 'currentColor' : 'none'}
      />
    </svg>
  );
}

export function SFCreative({ className, filled }: SymbolProps) {
  return (
    <svg {...base(className)}>
      <path
        d="M4 20h4.2L19.4 8.8a2 2 0 0 0 0-2.8l-1.4-1.4a2 2 0 0 0-2.8 0L4 15.8V20Z"
        fill={filled ? 'currentColor' : 'none'}
      />
      <path d="m13.5 6.5 4 4" />
    </svg>
  );
}

