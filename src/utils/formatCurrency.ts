// Currency and number formatting utilities

/**
 * Format number as Indonesian Rupiah currency
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format number with thousand separators (for display)
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('id-ID').format(value);
};

/**
 * Format input value with thousand separators as user types
 */
export const formatInputNumber = (value: string): string => {
  // Remove all non-numeric characters except dots and commas
  const numericValue = value.replace(/[^\d]/g, '');
  
  // Convert to number and format with thousand separators
  if (numericValue === '') return '';
  
  const number = parseInt(numericValue, 10);
  return formatNumber(number);
};

/**
 * Parse formatted number string to actual number
 */
export const parseNumber = (formattedValue: string): number => {
  // Remove all non-numeric characters
  const numericString = formattedValue.replace(/[^\d]/g, '');
  return numericString === '' ? 0 : parseInt(numericString, 10);
};

/**
 * Handle number input change with formatting
 */
export const handleNumberInputChange = (
  value: string,
  onChange: (formattedValue: string, numericValue: number) => void
) => {
  const formatted = formatInputNumber(value);
  const numeric = parseNumber(formatted);
  onChange(formatted, numeric);
};