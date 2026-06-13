export default function Badge({ children, color, className = '' }) {
  const fallbackColor = '#94a3b8';
  const bgColor = color || fallbackColor;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${className}`}
      style={{
        backgroundColor: `${bgColor}18`,
        color: bgColor,
        border: `1px solid ${bgColor}30`,
      }}
    >
      {children}
    </span>
  );
}
