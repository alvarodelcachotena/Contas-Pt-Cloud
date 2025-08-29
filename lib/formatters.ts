/**
 * Formatters for consistent date and number formatting
 * Prevents hydration mismatches by using consistent formatting options
 */

/**
 * Format a date consistently for Portuguese locale
 * @param date - Date object or date string
 * @returns Formatted date string (DD/MM/YYYY)
 */
export function formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    return dateObj.toLocaleDateString('pt-PT', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

/**
 * Format a number consistently for Portuguese locale
 * @param number - Number to format
 * @returns Formatted number string with Portuguese locale
 */
export function formatNumber(number: number): string {
    return number.toLocaleString('pt-PT');
}

/**
 * Format currency consistently for Portuguese locale
 * @param amount - Amount to format
 * @param currency - Currency code (default: EUR)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'EUR'): string {
    return new Intl.NumberFormat('pt-PT', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

/**
 * Format percentage consistently for Portuguese locale
 * @param value - Percentage value (0-100)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals: number = 2): string {
    return new Intl.NumberFormat('pt-PT', {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value / 100);
}

/**
 * Generate a consistent ID for client-side use
 * Uses a combination of timestamp and random number to avoid hydration issues
 * @returns Unique ID string
 */
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

