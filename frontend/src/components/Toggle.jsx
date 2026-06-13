export default function Toggle({ checked, onChange, label, disabled = false, id }) {
    const toggleId = id || `toggle-${Math.random().toString(36).slice(2)}`;
    return (
        <label htmlFor={toggleId} className="inline-flex items-center gap-3 cursor-pointer select-none">
            <div className="relative">
                <input
                    type="checkbox"
                    id={toggleId}
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    disabled={disabled}
                    className="sr-only peer"
                    aria-label={label}
                />
                <div className={`
          w-11 h-6 rounded-full transition-colors duration-150
          bg-cafe-crema/50 peer-checked:bg-cafe-roast
          peer-focus-visible:ring-2 peer-focus-visible:ring-cafe-roast peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-cafe-foam
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `} />
                <div className={`
          absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-cafe
          transition-transform duration-150
          peer-checked:translate-x-5
        `} />
            </div>
            {label && <span className="text-sm font-medium text-cafe-grounds">{label}</span>}
        </label>
    );
}
