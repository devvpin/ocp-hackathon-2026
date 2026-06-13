import React from 'react';

const Toast = ({ type = 'info', message, onClose }) => {
  const styles = {
    success: 'bg-green-100 border-green-400 text-green-700',
    error: 'bg-red-100 border-red-400 text-red-700',
    info: 'bg-blue-100 border-blue-400 text-blue-700',
  };

  return (
    <div className={`flex items-center justify-between px-4 py-3 border rounded shadow-md min-w-[250px] ${styles[type]}`} role="alert">
      <span className="block sm:inline">{message}</span>
      <button 
        onClick={onClose} 
        className="ml-4 flex items-center justify-center h-8 w-8 text-current opacity-70 hover:opacity-100 focus:outline-none"
        aria-label="Close toast"
      >
        &times;
      </button>
    </div>
  );
};

export default Toast;
