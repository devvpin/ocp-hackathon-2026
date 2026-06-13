export default function Skeleton({ variant = 'rect', width, height, className = '', count = 1 }) {
    const baseClass = 'animate-shimmer rounded-xl';
    const variants = {
        rect: `${baseClass} ${className}`,
        circle: `${baseClass} rounded-full ${className}`,
        text: `${baseClass} h-4 ${className}`,
    };
    const items = Array.from({ length: count });
    return (
        <>
            {items.map((_, i) => (
                <div
                    key={i}
                    className={variants[variant] || variants.rect}
                    style={{
                        width: width || '100%',
                        height: height || (variant === 'text' ? 16 : variant === 'circle' ? width || 40 : 40),
                    }}
                />
            ))}
        </>
    );
}
