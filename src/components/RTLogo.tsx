import React, { useState } from 'react';

interface RTLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  imageUrl?: string;
  subtitle?: string;
}

export const RTLogo: React.FC<RTLogoProps> = ({
  size = 64,
  className = '',
  showText = false,
  imageUrl,
  subtitle,
}) => {
  const [imgError, setImgError] = useState(false);

  // If a custom image was passed and hasn't failed, try to render it
  const renderCustomImage = imageUrl && !imgError;

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <div
        style={{ width: size, height: size }}
        className="relative shrink-0 flex items-center justify-center rounded-2xl shadow-md overflow-hidden bg-gradient-to-br from-[#7A1C30] via-[#5C1021] to-[#380712] border-2 border-[#D4AF37]/80 p-0.5"
      >
        {renderCustomImage ? (
          <img
            src={imageUrl}
            alt="RT Diagnostic Laboratories"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover rounded-xl"
          />
        ) : (
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full drop-shadow"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="shieldGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#8B1E3F" />
                <stop offset="60%" stopColor="#671128" />
                <stop offset="100%" stopColor="#3C0714" />
              </linearGradient>
              <linearGradient id="goldEdge" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#F9DF7B" />
                <stop offset="50%" stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#996515" />
              </linearGradient>
            </defs>

            {/* Outer Shield with Gold Edge */}
            <path
              d="M 50,6 C 75,6 92,16 92,34 C 92,68 72,88 50,96 C 28,88 8,68 8,34 C 8,16 25,6 50,6 Z"
              fill="url(#shieldGrad)"
              stroke="url(#goldEdge)"
              strokeWidth="2.5"
            />

            {/* Inner Shield Line */}
            <path
              d="M 50,11 C 71,11 86,19 86,35 C 86,64 69,82 50,90 C 31,82 14,64 14,35 C 14,19 29,11 50,11 Z"
              fill="none"
              stroke="#FFFFFF"
              strokeOpacity="0.3"
              strokeWidth="1"
            />

            {/* Medical Cross Watermark */}
            <g fill="#FFFFFF" opacity="0.15">
              <rect x="46" y="20" width="8" height="50" rx="2" />
              <rect x="25" y="41" width="50" height="8" rx="2" />
            </g>

            {/* Bold RT Monogram */}
            <g fill="#FFFFFF" fontWeight="900" fontFamily="sans-serif">
              {/* Letter R */}
              <path
                d="M 28,30 L 41,30 C 48,30 52,33.5 52,40 C 52,45 49,48 44,49.5 L 53,64 L 46,64 L 38,51 L 34,51 L 34,64 L 28,64 Z M 34,35 L 34,46 L 40,46 C 44,46 46,44 46,40.5 C 46,37 44,35 40,35 Z"
              />
              {/* Letter T */}
              <path
                d="M 54,30 L 72,30 L 72,35 L 66,35 L 66,64 L 60,64 L 60,35 L 54,35 Z"
              />
            </g>

            {/* Miniature Banner */}
            <rect x="22" y="68" width="56" height="8" rx="4" fill="#FFFFFF" />
            <text
              x="50"
              y="74"
              fontSize="4.2"
              fontWeight="900"
              fill="#671128"
              fontFamily="system-ui, sans-serif"
              textAnchor="middle"
              letterSpacing="0.8"
            >
              LABS
            </text>

            {/* Small decorative pipettes / diamond */}
            <circle cx="50" cy="84" r="1.5" fill="#F9DF7B" />
            <circle cx="43" cy="84" r="1" fill="#FFFFFF" opacity="0.7" />
            <circle cx="57" cy="84" r="1" fill="#FFFFFF" opacity="0.7" />
          </svg>
        )}
      </div>

      {showText && (
        <div className="flex flex-col text-right">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-rose-950 text-base sm:text-lg leading-tight tracking-tight">
              معامل RT للتحاليل التشخيصية
            </span>
          </div>
          <span className="text-[11px] font-extrabold text-[#7A1C30] uppercase tracking-wider font-sans">
            RT Diagnostic Laboratories
          </span>
          <span className="text-[10px] font-bold text-slate-700 leading-snug">
            {subtitle || 'استشاريو كلية طب قصر العيني'}
          </span>
          <span className="text-[9px] text-slate-500 font-sans tracking-wide">
            KASR AL AINY FACULTY OF MEDICINE CONSULTANTS
          </span>
        </div>
      )}
    </div>
  );
};
