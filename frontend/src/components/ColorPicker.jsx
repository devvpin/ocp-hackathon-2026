import React from 'react';

const ColorPicker = ({ value, onChange, label = 'Color' }) => {
  return (
    <div className="flex flex-col gap-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-2">
        <div 
          className="w-10 h-10 rounded shadow-sm border border-gray-300 overflow-hidden relative cursor-pointer min-w-[44px] min-h-[44px] flex-shrink-0"
        >
          <input
            type="color"
            value={value || '#000000'}
            onChange={(e) => onChange(e.target.value)}
            className="absolute -inset-2 w-16 h-16 cursor-pointer"
            aria-label="Choose color visually"
          />
        </div>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm min-h-[44px]"
          aria-label="Hex color input"
        />
      </div>
    </div>
  );
};

export default ColorPicker;
