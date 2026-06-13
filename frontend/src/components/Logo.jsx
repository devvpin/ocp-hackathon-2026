import logoUrl from '../assets/Logo.svg';

export default function Logo({ className = 'h-10', alt = 'Cafe logo', onDark = false, compact = false }) {
  if (onDark) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-cafe bg-cafe-foam/95 shadow-cafe overflow-hidden ${
          compact ? 'h-10 w-10 p-0.5' : 'p-1'
        }`}
      >
        <img
          src={logoUrl}
          alt={alt}
          className={compact ? 'h-full w-full object-contain' : `${className} w-auto object-contain`}
        />
      </span>
    );
  }

  return (
    <img src={logoUrl} alt={alt} className={`${className} w-auto object-contain`} />
  );
}
