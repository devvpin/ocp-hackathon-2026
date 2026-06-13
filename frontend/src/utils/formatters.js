/**
 * Currency formatter
 */
const CURRENCY = import.meta.env.VITE_CURRENCY || 'INR';
const LOCALE = import.meta.env.VITE_CURRENCY_LOCALE || 'en-IN';

export function formatCurrency(amount) {
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: CURRENCY,
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

/**
 * Date formatter - short
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

/**
 * Date formatter - with time
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Time formatter
 */
export function formatTime(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Percentage formatter
 */
export function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

/**
 * Duration between two dates
 */
export function formatDuration(startStr, endStr) {
  if (!startStr) return '—';
  const start = new Date(startStr);
  const end = endStr ? new Date(endStr) : new Date();
  const diffMs = end - start;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

/**
 * Truncate text
 */
export function truncate(str, maxLength = 30) {
  if (!str) return '';
  return str.length > maxLength ? str.substring(0, maxLength) + '…' : str;
}
