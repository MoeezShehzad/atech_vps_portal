/**
 * Global Date Formatting Utility for ATECH Cloud
 * Format Standard: "October 14, 2026"
 * With time: "October 14, 2026, 4:25 PM"
 */

export function formatDate(
  dateInput: string | Date | number | null | undefined,
  includeTime = false
): string {
  if (!dateInput) return 'N/A';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'N/A';

  const dateStr = d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  if (includeTime) {
    const timeStr = d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return `${dateStr}, ${timeStr}`;
  }

  return dateStr;
}

export function formatDateTime(dateInput: string | Date | number | null | undefined): string {
  return formatDate(dateInput, true);
}
