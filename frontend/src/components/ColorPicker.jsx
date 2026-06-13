import { useState } from 'react';
const presetColors = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
  '#EC4899', '#14B8A6', '#6366F1', '#F97316', '#84CC16',
  '#06B6D4', '#A855F7', '#E11D48', '#0EA5E9', '#D946EF',
];
export default function ColorPicker({ value = '#3B82F6', onChange, label }) {
  const [showPicker, setShowPicker] = useState(false);
  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-surface-700">{label}</label>}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setShowPicker(!showPicker)}
          className="w-10 h-10 rounded-xl border-2 border-surface-300 shadow-sm cursor-pointer hover:scale-105 transition-transform"
          style={{ backgroundColor: value }}
          aria-label="Pick a color"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="w-28 px-3 py-2 bg-surface-50 border border-surface-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
          aria-label="Color hex value"
        />
      </div>
      {showPicker && (
        <div className="flex flex-wrap gap-2 p-3 bg-surface-50 rounded-xl border border-surface-200 animate-slide-down">
          {presetColors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => {
                onChange(color);
                setShowPicker(false);
              }}
              className={`w-7 h-7 rounded-lg cursor-pointer hover:scale-110 transition-transform ${value === color ? 'ring-2 ring-offset-2 ring-primary-500' : 'border border-surface-200'}`}
              style={{ backgroundColor: color }}
              aria-label={`Select color ${color}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}