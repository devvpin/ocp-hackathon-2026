import { useState, useEffect, useRef } from 'react';
export default function SearchBar({
  value = '',
  onChange,
  placeholder = 'Search...',
  className = '',
  debounceMs = 300,
  dark = false,
}) {
  const [localValue, setLocalValue] = useState(value);
  const timerRef = useRef(null);
  useEffect(() => {
    setLocalValue(value);
  }, [value]);
  const handleChange = (e) => {
    const val = e.target.value;
    setLocalValue(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onChange(val);
    }, debounceMs);
  };
  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  const inputClasses = dark
    ? 'bg-cafe-foam/10 text-cafe-foam placeholder:text-cafe-foam/50 border-cafe-foam/20 focus:bg-white focus:text-cafe-grounds focus:placeholder:text-cafe-grounds/50'
    : 'bg-white border-cafe-crema text-cafe-grounds placeholder:text-cafe-grounds/50';

  return (
    <div className={`relative ${className}`}>
      <svg
        className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${dark ? 'text-cafe-foam/50' : 'text-cafe-grounds/50'}`}
        fill="none" viewBox="0 0 24 24" stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={`w-full pl-10 pr-9 py-2.5 border rounded-cafe text-sm focus:outline-none focus:ring-2 focus:ring-cafe-roast focus:border-cafe-roast transition-all duration-150 ${inputClasses}`}
        aria-label={placeholder}
      />
      {localValue && (
        <button
          onClick={handleClear}
          className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-cafe transition-colors ${dark ? 'hover:bg-cafe-foam/20 text-cafe-foam/60' : 'hover:bg-cafe-crema/30 text-cafe-grounds/50 hover:text-cafe-grounds'}`}
          aria-label="Clear search"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
