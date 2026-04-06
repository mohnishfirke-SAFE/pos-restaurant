/**
 * Format a number as Indian Rupees (INR) with Indian numbering system.
 * e.g., 1234567.89 → "₹12,34,567.89"
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a number with Indian numbering system (no currency symbol).
 * e.g., 1234567.89 → "12,34,567.89"
 */
export function formatIndianNumber(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
