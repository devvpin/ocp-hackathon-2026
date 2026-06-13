const variants = {
  primary: 'bg-cafe-roast text-cafe-foam hover:bg-cafe-espresso focus:ring-cafe-roast shadow-cafe hover:shadow-cafe-lg',
  secondary: 'bg-cafe-crema text-cafe-espresso hover:bg-cafe-crema/80 focus:ring-cafe-roast',
  danger: 'bg-status-danger text-cafe-foam hover:bg-status-danger/90 focus:ring-status-danger shadow-cafe',
  ghost: 'bg-transparent text-cafe-roast hover:bg-cafe-crema/30 focus:ring-cafe-roast',
  success: 'bg-status-success text-cafe-foam hover:bg-status-success/90 focus:ring-status-success shadow-cafe',
};
const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-cafe',
  md: 'px-4 py-2.5 text-sm rounded-cafe',
  lg: 'px-6 py-3 text-base rounded-cafe',
};
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`
        inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-cafe-foam
        disabled:bg-cafe-crema/40 disabled:text-cafe-grounds/40 disabled:cursor-not-allowed disabled:shadow-none
        active:scale-[0.98]
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <svg className="w-4 h-4 animate-spin-slow" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
