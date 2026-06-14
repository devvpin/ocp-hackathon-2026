'use strict';

const env = require('../config/env');

function money(value) {
  return `Rs. ${Number(value || 0).toFixed(2)}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(value) {
  return new Date(value).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildReceiptText(order) {
  const lines = [
    `${env.CAFE_NAME} receipt #${order.orderNumber}`,
    `Date: ${formatDate(order.createdAt)}`,
    `Customer: ${order.customer?.name || 'Guest'}`,
    `Table: ${order.table?.tableNumber || 'N/A'}`,
    '',
    'Items:',
    ...order.items.map((item) => `${item.quantity} x ${item.productName} - ${money(item.lineTotal)}`),
    '',
    `Subtotal: ${money(order.subtotal)}`,
    `Tax: ${money(order.taxAmount)}`,
    `Discount: ${money(order.discountAmount)}`,
    `Total: ${money(order.total)}`,
    '',
    `Thank you for dining with ${env.CAFE_NAME}.`,
  ];

  return lines.join('\n');
}

function buildReceiptHtml(order) {
  const rows = order.items.map((item) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${escapeHtml(item.productName)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${money(item.unitPrice)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:700;">${money(item.lineTotal)}</td>
    </tr>
  `).join('');

  const discountRow = Number(order.discountAmount) > 0
    ? `<tr><td style="padding:5px 0;color:#15803d;">Discount</td><td style="padding:5px 0;text-align:right;color:#15803d;">-${money(order.discountAmount)}</td></tr>`
    : '';

  return `
    <div style="margin:0;padding:24px;background:#f3f4f6;font-family:Arial,sans-serif;color:#111827;">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
        <div style="background:#111827;color:#ffffff;padding:24px;">
          <h1 style="margin:0;font-size:22px;">${escapeHtml(env.CAFE_NAME)}</h1>
          <p style="margin:6px 0 0;color:#d1d5db;">Bill receipt #${order.orderNumber}</p>
        </div>

        <div style="padding:24px;">
          <table style="width:100%;margin-bottom:18px;font-size:14px;" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:3px 0;color:#6b7280;">Date</td>
              <td style="padding:3px 0;text-align:right;">${formatDate(order.createdAt)}</td>
            </tr>
            <tr>
              <td style="padding:3px 0;color:#6b7280;">Customer</td>
              <td style="padding:3px 0;text-align:right;">${escapeHtml(order.customer?.name || 'Guest')}</td>
            </tr>
            <tr>
              <td style="padding:3px 0;color:#6b7280;">Table</td>
              <td style="padding:3px 0;text-align:right;">${escapeHtml(order.table?.tableNumber || 'N/A')}</td>
            </tr>
            <tr>
              <td style="padding:3px 0;color:#6b7280;">Payment</td>
              <td style="padding:3px 0;text-align:right;text-transform:capitalize;">${escapeHtml(order.paymentMethod || 'Unpaid')}</td>
            </tr>
          </table>

          <table style="width:100%;border-collapse:collapse;font-size:14px;" cellpadding="0" cellspacing="0">
            <thead>
              <tr style="background:#f9fafb;">
                <th style="padding:10px 12px;text-align:left;color:#4b5563;">Item</th>
                <th style="padding:10px 12px;text-align:center;color:#4b5563;">Qty</th>
                <th style="padding:10px 12px;text-align:right;color:#4b5563;">Rate</th>
                <th style="padding:10px 12px;text-align:right;color:#4b5563;">Amount</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>

          <table style="width:100%;margin-top:16px;font-size:14px;" cellpadding="0" cellspacing="0">
            <tr><td style="padding:5px 0;color:#6b7280;">Subtotal</td><td style="padding:5px 0;text-align:right;">${money(order.subtotal)}</td></tr>
            <tr><td style="padding:5px 0;color:#6b7280;">Tax</td><td style="padding:5px 0;text-align:right;">${money(order.taxAmount)}</td></tr>
            ${discountRow}
            <tr>
              <td style="padding:12px 0 0;border-top:2px solid #111827;font-size:18px;font-weight:700;">Total</td>
              <td style="padding:12px 0 0;border-top:2px solid #111827;text-align:right;font-size:18px;font-weight:700;">${money(order.total)}</td>
            </tr>
          </table>
        </div>

        <div style="padding:16px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;color:#6b7280;font-size:13px;">
          Thank you for dining with us.
        </div>
      </div>
    </div>
  `;
}

function buildReceiptEmail(order) {
  return {
    subject: `${env.CAFE_NAME} bill receipt #${order.orderNumber}`,
    html: buildReceiptHtml(order),
    text: buildReceiptText(order),
  };
}

module.exports = { buildReceiptEmail };
