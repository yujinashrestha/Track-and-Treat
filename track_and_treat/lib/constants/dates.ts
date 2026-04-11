// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/lib/constants/dates.ts
// ─────────────────────────────────────────────────────────────────────────────

export const TODAY      = new Date(2025, 3, 6); // April 6, 2025 (Sunday)
export const WEEK_DAYS  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
export const MONTHS     = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;
