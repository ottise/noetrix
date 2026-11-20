export type HapticStyle = 'selection' | 'light' | 'medium' | 'success' | 'warning';

const VIBRATE_PATTERNS: Record<HapticStyle, number | number[]> = {
  selection: 6,
  light: 10,
  medium: 18,
  success: [10, 45, 16],
  warning: [16, 40, 16],
};

/**
 * Tactile feedback helper following Apple UIImpactFeedbackGenerator / UISelectionFeedbackGenerator semantics.
 * Gracefully degrades on browsers/iOS Safari without throwing errors.
 */
export function triggerHaptic(style: HapticStyle = 'selection'): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(VIBRATE_PATTERNS[style]);
    }
  } catch {
    // Ignore when vibration is unsupported or blocked
  }
}
