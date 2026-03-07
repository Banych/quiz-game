/**
 * Generate a unique join code for quiz sessions.
 * Format: JOIN-XXXX (4 uppercase alphanumeric chars)
 * Excludes ambiguous characters: I, 1, O, 0
 */
export function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const suffix = Array.from(
    { length: 4 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join('');
  return `JOIN-${suffix}`;
}
