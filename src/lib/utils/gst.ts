/**
 * GST calculation utilities for Indian taxation.
 */

export interface GSTBreakdown {
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  total: number;
}

/**
 * Calculate GST breakdown for a given subtotal.
 * For intra-state: split into CGST + SGST (each half of GST rate).
 * For inter-state: use IGST (full GST rate).
 */
export function calculateGST(
  subtotal: number,
  gstRate: number,
  isInterState: boolean = false
): GSTBreakdown {
  const totalTax = (subtotal * gstRate) / 100;

  if (isInterState) {
    return {
      subtotal,
      cgst: 0,
      sgst: 0,
      igst: totalTax,
      totalTax,
      total: subtotal + totalTax,
    };
  }

  const halfTax = totalTax / 2;
  return {
    subtotal,
    cgst: Math.round(halfTax * 100) / 100,
    sgst: Math.round(halfTax * 100) / 100,
    igst: 0,
    totalTax: Math.round(totalTax * 100) / 100,
    total: Math.round((subtotal + totalTax) * 100) / 100,
  };
}

/**
 * Common GST rates for food items in India.
 */
export const GST_RATES = {
  EXEMPT: 0,
  FIVE: 5,
  TWELVE: 12,
  EIGHTEEN: 18,
  TWENTY_EIGHT: 28,
} as const;
