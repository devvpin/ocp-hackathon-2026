import logoUrl from '../assets/Logo.svg';

export default function Logo({ className = 'h-10', alt = 'Cafe logo', onDark = false }) {
  const img = (
    <img
      src={logoUrl}
      alt={alt}
      className={`${className} w-auto object-contain`}
    />
  );

  if (onDark) {
    return (
      <span className="inline-flex items-center justify-center rounded-cafe bg-cafe-foam/95 p-1 shadow-cafe">
        {img}
      </span>
    );
  }

  return img;
}
