export default function Badge({ children, color, className = '' }) {
  const fallbackColor = '#8a6f52';
  const bgColor = color || fallbackColor;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-cafe text-xs font-medium font-sans border ${className}`}
      style={{
        backgroundColor: `${bgColor}18`,
        color: bgColor,
        borderColor: `${bgColor}40`,
      }}
    >
      {children}
    </span>
  );
}
