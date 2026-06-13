import { QRCodeSVG } from 'qrcode.react';
export default function QRCode({ value, size = 200, className = '', showCaption = true }) {
    if (!value) {
        return (
            <div
                className={`flex items-center justify-center bg-cafe-foam rounded-cafe border border-cafe-crema/40 ${className}`}
                style={{ width: size, height: size }}
            >
                <span className="text-sm text-cafe-grounds/50">No QR data</span>
            </div>
        );
    }
    return (
        <div className={`inline-flex flex-col items-center gap-2 ${className}`}>
            <div className="inline-flex p-4 bg-white rounded-cafe shadow-cafe border border-cafe-crema/40">
                <QRCodeSVG
                    value={value}
                    size={size}
                    level="H"
                    includeMargin={false}
                    bgColor="#fff7e8"
                    fgColor="#341100"
                />
            </div>
            {showCaption && (
                <p className="font-display text-sm text-cafe-espresso">Scan to Pay</p>
            )}
        </div>
    );
}
