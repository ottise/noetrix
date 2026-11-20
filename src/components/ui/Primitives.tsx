import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { triggerHaptic } from '../../lib/haptics';
import { SFXMark, SFChevronRight } from './SFSymbols';

export function Card({
  children,
  className = '',
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={() => {
        if (onClick) {
          triggerHaptic('selection');
          onClick();
        }
      }}
      className={`ios-card p-4 ${onClick ? 'cursor-pointer ios-pressable' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * Exact Native iOS Segmented Control:
 * height: 34px, container bg rgba(118, 118, 128, 0.24), radius 9px, 2px padding,
 * active segment bg #636366 (dark) / #FFFFFF (light) with subtle shadow and 7px radius.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = '',
}: {
  options: { value: T; label: string; badge?: string | number }[];
  value: T;
  onChange: (val: T) => void;
  className?: string;
}) {
  const activeIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value)
  );
  const count = Math.max(1, options.length);

  return (
    <div
      role="tablist"
      className={`relative grid w-full h-[34px] rounded-[9px] p-[2px] select-none ${className}`}
      style={{
        gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))`,
        backgroundColor: 'var(--ios-seg-track)',
      }}
    >
      {/* Active Sliding Segment */}
      <div
        aria-hidden="true"
        className="absolute top-[2px] bottom-[2px] left-[2px] rounded-[7px] transition-transform duration-250"
        style={{
          width: `calc((100% - 4px) / ${count})`,
          transform: `translateX(${activeIndex * 100}%)`,
          backgroundColor: 'var(--ios-seg-active)',
          boxShadow: '0 3px 8px rgba(0, 0, 0, 0.16), 0 1px 1px rgba(0, 0, 0, 0.1)',
          transitionTimingFunction: 'var(--ios-spring)',
        }}
      />

      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => {
              if (!active) {
                triggerHaptic('selection');
                onChange(opt.value);
              }
            }}
            className="relative z-10 flex items-center justify-center gap-1 px-2 h-full rounded-[7px] text-[13px] tracking-[-0.01em] transition-colors duration-150 cursor-pointer"
            style={{
              color: active ? 'var(--ios-label)' : 'var(--ios-label-secondary)',
              fontWeight: active ? 600 : 500,
            }}
          >
            <span className="truncate">{opt.label}</span>
            {opt.badge !== undefined && opt.badge !== 0 && (
              <span className="text-[11px] opacity-75 tabular-nums">({opt.badge})</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Authentic Apple UISwitch */
export function IOSSwitch({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  onChange: () => void;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => {
        triggerHaptic('light');
        onChange();
      }}
      className="relative inline-flex h-[31px] w-[51px] shrink-0 items-center rounded-full p-[2px] transition-colors duration-300 cursor-pointer"
      style={{
        backgroundColor: checked ? 'var(--ios-green)' : 'rgba(120, 120, 128, 0.36)',
        transitionTimingFunction: 'var(--ios-spring)',
      }}
    >
      <span
        className="inline-block h-[27px] w-[27px] rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,0.2)] transition-transform duration-300"
        style={{
          transform: checked ? 'translateX(20px)' : 'translateX(0px)',
          transitionTimingFunction: 'var(--ios-spring)',
        }}
      />
    </button>
  );
}

/** Native iOS Inset Grouped List (#1C1C1E, radius 14px, 0.5px inset hairlines ml-4, NO outer border) */
export function IOSListGroup({
  header,
  headerRight,
  footer,
  children,
}: {
  header?: string;
  headerRight?: React.ReactNode;
  footer?: string;
  children: React.ReactNode;
}) {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <section className="space-y-2">
      {(header || headerRight) && (
        <div className="flex items-center justify-between px-4">
          {header && <h3 className="ios-section-header">{header}</h3>}
          {headerRight}
        </div>
      )}
      <div className="ios-group">
        {items.map((child, idx) => (
          <React.Fragment key={idx}>
            {child}
            {idx < items.length - 1 && <div className="ios-inset-divider" />}
          </React.Fragment>
        ))}
      </div>
      {footer && (
        <p className="text-[12px] leading-[16px] text-[var(--ios-label-secondary)] px-4">
          {footer}
        </p>
      )}
    </section>
  );
}

export function IOSListRow({
  title,
  subtitle,
  trailing,
  disclosure = false,
  onClick,
}: {
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  disclosure?: boolean;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <div className="min-w-0 flex-1">
        <p className="text-[17px] leading-[22px] font-medium text-[var(--ios-label)] truncate">
          {title}
        </p>
        {subtitle && (
          <p className="text-[14px] leading-[19px] text-[var(--ios-label-secondary)] mt-0.5 line-clamp-2">
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {trailing}
        {disclosure && (
          <SFChevronRight className="w-4 h-4 text-[var(--ios-label-tertiary)]" />
        )}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={() => {
          triggerHaptic('selection');
          onClick();
        }}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left active:bg-[var(--ios-fill)] transition-colors cursor-pointer"
      >
        {inner}
      </button>
    );
  }

  return <div className="px-4 py-3 flex items-center justify-between gap-3">{inner}</div>;
}

/**
 * Strictly disciplined iOS Badge:
 * Only Neutral (#2C2C2E), Primary Tint (#0A84FF), Positive Green (#30D158), Destructive Red (#FF453A).
 * Legacy rainbow tone names gracefully map to neutral or blue to avoid rainbow clutter.
 */
export function Badge({
  children,
  tone = 'neutral',
  className = '',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'cyan';
  className?: string;
}) {
  let style: React.CSSProperties;
  if (tone === 'green') {
    style = {
      backgroundColor: 'color-mix(in srgb, var(--ios-green) 16%, transparent)',
      color: 'var(--ios-green)',
    };
  } else if (tone === 'red') {
    style = {
      backgroundColor: 'color-mix(in srgb, var(--ios-red) 16%, transparent)',
      color: 'var(--ios-red)',
    };
  } else if (tone === 'blue' || tone === 'purple' || tone === 'cyan') {
    style = {
      backgroundColor: 'color-mix(in srgb, var(--ios-blue) 16%, transparent)',
      color: 'var(--ios-blue)',
    };
  } else {
    style = {
      backgroundColor: 'var(--ios-fill)',
      color: 'var(--ios-label-secondary)',
    };
  }

  return (
    <span
      style={style}
      className={`inline-flex items-center px-2.5 py-[3px] rounded-full text-[12px] font-medium tracking-[-0.01em] tabular-nums ${className}`}
    >
      {children}
    </span>
  );
}

/** Slim 6px Apple-style Progress Bar */
export function ProgressBar({
  value,
  max = 100,
  positive = false,
  heightClass = 'h-[6px]',
}: {
  value: number;
  max?: number;
  colorClass?: string;
  positive?: boolean;
  heightClass?: string;
}) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.max(0, Math.round((value / max) * 100)));
  return (
    <div
      className={`w-full rounded-full overflow-hidden ${heightClass}`}
      style={{ backgroundColor: 'var(--ios-fill)' }}
    >
      <div
        className={`${heightClass} rounded-full transition-all duration-500`}
        style={{
          width: `${pct}%`,
          backgroundColor: positive ? 'var(--ios-green)' : 'var(--ios-blue)',
          transitionTimingFunction: 'var(--ios-spring)',
        }}
      />
    </div>
  );
}

/** Borderless Native iOS Bottom Sheet */
export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = 'max-w-xl',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  const content = (
    <div
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-[5px] p-0 sm:p-6 animate-ios-backdrop"
      onClick={() => {
        triggerHaptic('light');
        onClose();
      }}
    >
      <div
        className={`w-full ${maxWidth} max-h-[88dvh] flex flex-col rounded-t-[28px] sm:rounded-[20px] overflow-hidden animate-ios-sheet shadow-2xl`}
        style={{
          backgroundColor: 'var(--ios-sheet-bg)',
          border: '1px solid rgba(217, 213, 203, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden flex justify-center pt-2.5 pb-1">
          <div
            className="w-9 h-[5px] rounded-full"
            style={{ backgroundColor: 'rgba(142, 142, 147, 0.45)' }}
          />
        </div>

        <div className="relative flex items-center justify-center px-5 py-3.5 ios-hairline-b">
          <h3 className="text-[17px] font-semibold tracking-[-0.014em] text-center truncate max-w-[72%]">
            {title}
          </h3>
          <button
            type="button"
            aria-label="Đóng"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="absolute right-4 w-7 h-7 rounded-full flex items-center justify-center ios-pressable cursor-pointer"
            style={{
              backgroundColor: 'var(--ios-fill)',
              color: 'var(--ios-label-secondary)',
            }}
          >
            <SFXMark className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto flex-1 safe-bottom">{children}</div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : content;
}

export function EmptyState({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-6 ios-group">
      <p className="text-[16px] font-semibold text-[var(--ios-label)]">{title}</p>
      <p className="text-[14px] text-[var(--ios-label-secondary)] mt-1.5 max-w-xs leading-relaxed">
        {subtitle}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Apple Reminders circular checkmark ring */
export function CheckDot({
  checked,
  size = 'md',
}: {
  checked: boolean;
  accentClass?: string;
  size?: 'sm' | 'md';
}) {
  const dim = size === 'sm' ? 'w-[18px] h-[18px] text-[10px]' : 'w-[24px] h-[24px] text-[13px]';
  return (
    <span
      className={`${dim} shrink-0 inline-flex items-center justify-center rounded-full border-[1.75px] font-bold transition-all duration-200`}
      style={{
        backgroundColor: checked ? 'var(--ios-green)' : 'transparent',
        borderColor: checked ? 'var(--ios-green)' : 'var(--ios-label-tertiary)',
        color: '#ffffff',
      }}
    >
      {checked ? '✓' : null}
    </span>
  );
}

interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

const ToastContext = createContext<{
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}>({ showToast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    triggerHaptic(type === 'error' ? 'warning' : type === 'success' ? 'success' : 'light');
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-2), { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2600);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-2 left-4 right-4 z-[80] flex flex-col items-center gap-2 pointer-events-none safe-top">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto animate-ios-toast flex items-center gap-2.5 px-4 py-2.5 rounded-full text-[13px] font-medium max-w-sm shadow-xl"
            style={{
              backgroundColor: 'var(--ios-fill)',
              color: 'var(--ios-label)',
            }}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{
                backgroundColor:
                  t.type === 'success'
                    ? 'var(--ios-green)'
                    : t.type === 'error'
                    ? 'var(--ios-red)'
                    : 'var(--ios-blue)',
              }}
            />
            <span className="truncate">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
