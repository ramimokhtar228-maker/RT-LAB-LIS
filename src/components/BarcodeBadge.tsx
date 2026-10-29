import React from 'react';

interface BarcodeProps {
  value: string;
  className?: string;
  height?: number;
}

export const BarcodeBadge: React.FC<BarcodeProps> = ({ value, className = '', height = 36 }) => {
  // Generate pseudo Code-128 bars deterministically from value string
  const bars = React.useMemo(() => {
    const chars = value.split('');
    const pattern: number[] = [];
    chars.forEach((c) => {
      const code = c.charCodeAt(0);
      pattern.push((code % 3) + 1);
      pattern.push(((code >> 1) % 2) + 1);
      pattern.push(((code >> 2) % 3) + 1);
      pattern.push(((code >> 3) % 2) + 1);
    });
    return pattern;
  }, [value]);

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <svg height={height} width={Math.max(120, bars.length * 2.8 + 20)} className="overflow-visible">
        <rect x="0" y="0" width="100%" height={height} fill="transparent" />
        {/* Start guard */}
        <rect x="5" y="0" width="2" height={height} fill="#1e293b" />
        <rect x="9" y="0" width="1.5" height={height} fill="#1e293b" />
        {bars.map((w, idx) => {
          if (idx % 2 === 0) {
            const x = 14 + idx * 2.6;
            return <rect key={idx} x={x} y="0" width={w * 1.3} height={height} fill="#1e293b" />;
          }
          return null;
        })}
        {/* End guard */}
        <rect x={14 + bars.length * 2.6 + 2} y="0" width="2" height={height} fill="#1e293b" />
        <rect x={14 + bars.length * 2.6 + 6} y="0" width="1.5" height={height} fill="#1e293b" />
      </svg>
      <span className="font-mono text-[10px] tracking-widest text-slate-600 font-semibold mt-0.5">
        *{value}*
      </span>
    </div>
  );
};

export const OfficialLabStamp: React.FC<{ text?: string; date?: string; className?: string }> = ({
  text = 'معامل RT للتحاليل التشخيصية',
  date,
  className = '',
}) => {
  const currentDate = date || new Date().toISOString().split('T')[0];

  return (
    <div
      className={`relative inline-block w-36 h-36 rounded-full border-4 border-rose-800 p-1 select-none pointer-events-none transform -rotate-6 transition-transform opacity-95 ${className}`}
      style={{
        boxShadow: 'inset 0 0 0 2px #991b1b, 0 0 10px rgba(153, 27, 27, 0.15)',
        color: '#991b1b',
      }}
    >
      <div className="w-full h-full rounded-full border-2 border-dashed border-rose-800 flex flex-col items-center justify-center p-2 text-center bg-rose-50/20">
        <div className="text-[9px] font-black tracking-tighter uppercase text-rose-900 leading-tight">
          RT DIAGNOSTIC LABS
        </div>
        <div className="text-[10px] font-extrabold text-rose-800 mt-0.5">
          {text}
        </div>
        <div className="w-16 h-px bg-rose-800 my-1" />
        <div className="text-[8px] font-bold text-rose-700 tracking-wider">
          د. رامي مختار - معتمد
        </div>
        <div className="text-[8px] font-mono font-bold text-rose-900 mt-0.5">
          {currentDate}
        </div>
        <div className="text-[7px] text-rose-600 font-semibold">
          ★ OFFICIAL VERIFIED STAMP ★
        </div>
      </div>
    </div>
  );
};
