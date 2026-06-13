import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

const QRCode = ({ value, size = 128, level = 'M', includeMargin = false }) => {
  if (!value) return null;

  return (
    <div className="flex justify-center p-2 bg-white rounded-md shadow-sm border border-gray-100">
      <QRCodeSVG
        value={value}
        size={size}
        level={level}
        includeMargin={includeMargin}
      />
    </div>
  );
};

export default QRCode;
