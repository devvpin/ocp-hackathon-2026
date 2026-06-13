import { QRCodeSVG } from 'qrcode.react';
export default function QRCode({ value, size = 200, className = '' }) {
    if (!value) {
        return (
            <div
                className={`flex items-center justify-center bg-surface-100 rounded-xl border border-surface-200 ${className}`}
                style={{ width: size, height: size }}
            >
                <span className="text-sm text-surface-400">No QR data</span>
            </div>
        );
    }
    return (
        <div className={`inline-flex p-4 bg-white rounded-2xl shadow-sm border border-surface-200 ${className}`}>
            <QRCodeSVG
                value={value}
                size={size}
                level="H"
                includeMargin={false}
                bgColor="#ffffff"
                fgColor="#0f172a"
            />
        </div>
    );
}