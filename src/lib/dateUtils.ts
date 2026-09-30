/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * src/lib/dateUtils.ts
 * Standardized Date Formatting across the entire NP Job Portal / Print Bay app.
 * Strict Format: DD/MM/YYYY and DD/MM/YYYY hh:mm A (12-hour IST format).
 */

/**
 * Formats a Date or timestamp string into DD/MM/YYYY
 * Example: 2026-09-30 -> "30/09/2026"
 */
export function formatDDMMYYYY(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return 'N/A';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'N/A';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Formats a Date or timestamp string into DD/MM/YYYY hh:mm A
 * Example: "30/09/2026 12:45 PM"
 */
export function formatDDMMYYYYWithTime(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return 'N/A';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'N/A';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 hour should be 12
  const strHours = String(hours).padStart(2, '0');

  return `${day}/${month}/${year} ${strHours}:${minutes} ${ampm}`;
}
