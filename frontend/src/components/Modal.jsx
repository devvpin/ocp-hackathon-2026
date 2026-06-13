import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
export default function Modal({ isOpen, onClose, title, children, size = 'md', className = '' }) {
  const overlayRef = useRef(null);
  const contentRef = useRef(null);
  const focusedOnOpenRef = useRef(false);
  useEffect(() => {
    if (!isOpen) {
      focusedOnOpenRef.current = false;
      return;
    }
    
    // Only focus on initial open, not on every re-render
    if (focusedOnOpenRef.current) return;
    
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    
    // Focus trap - only run once when modal opens
    const focusableElements = contentRef.current?.querySelectorAll(
      'input, textarea, select, button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements?.length) {
      // Focus on first input/textarea if available, otherwise first focusable element
      const inputElement = Array.from(focusableElements).find(el => el.matches('input, textarea'));
      (inputElement || focusableElements[0]).focus();
      focusedOnOpenRef.current = true;
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl',
  };
  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="fixed inset-0 bg-cafe-noir/50 backdrop-blur-sm animate-fade-in" />
      <div
        ref={contentRef}
        className={`relative bg-white rounded-cafe shadow-cafe-lg border border-cafe-crema/40 w-full ${sizeClasses[size] || sizeClasses.md} max-h-[90vh] flex flex-col animate-scale-in ${className}`}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-cafe-crema/40">
            <h2 className="font-display text-xl font-semibold text-cafe-espresso">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-cafe hover:bg-cafe-crema/30 transition-colors text-cafe-grounds/70 hover:text-cafe-grounds"
              aria-label="Close dialog"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="px-6 py-4 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>,
    document.body
  );
}
