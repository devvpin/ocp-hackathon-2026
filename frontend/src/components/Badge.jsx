import React from 'react';

const Badge = ({ children, colorHex, className = '' }) => {
  // If no color provided, use a neutral gray.
  // We use inline styles for dynamic hex backgrounds, and Tailwind for structure.
  const style = colorHex ? { backgroundColor: colorHex, color: '#fff' } : {};
  const defaultClass = colorHex ? '' : 'bg-gray-200 text-gray-800';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${defaultClass} ${className}`}
      style={style}
    >
      {children}
    </span>
  );
};

export default Badge;
