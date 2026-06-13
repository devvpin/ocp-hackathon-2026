import Button from './Button';

function CoffeeCupIcon({ className = 'w-8 h-8' }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 24h32v24a8 8 0 01-8 8H20a8 8 0 01-8-8V24z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/>
      <path d="M44 28h4a8 8 0 010 16h-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M20 16c0-4 3-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
      <path d="M28 14c0-4 3-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
    </svg>
  );
}

export default function EmptyState({
  icon,
  message = 'No items found',
  description,
  action,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      {icon || (
        <div className="w-16 h-16 rounded-cafe bg-cafe-crema/20 flex items-center justify-center mb-4 text-cafe-roast">
          <CoffeeCupIcon />
        </div>
      )}
      <p className="text-cafe-grounds font-medium text-center font-display">{message}</p>
      {description && (
        <p className="text-cafe-grounds/60 text-sm mt-1 text-center max-w-xs">{description}</p>
      )}
      {action && (
        <div className="mt-4">
          <Button variant="primary" size="sm" onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}
