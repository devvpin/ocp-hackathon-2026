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
          w-11 h-6 rounded-full transition-colors duration-200
          bg-surface-300 peer-checked:bg-primary-600
          peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 peer-focus-visible:ring-offset-2
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `} />
                <div className={`
          absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md
          transition-transform duration-200
          peer-checked:translate-x-5
        `} />
            </div>
            {label && <span className="text-sm font-medium text-surface-700">{label}</span>}
        </label>
    );
}
