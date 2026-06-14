/**
 * Currency formatter — Indian Rupees
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

/**
 * Date formatter - short
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
  }).format(new Date(dateStr));
}

/**
 * Date formatter - with time
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateStr));
}

/**
 * Time formatter
 */
export function formatTime(dateStr) {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateStr));
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
