
import React from 'react';

const TEETH_NUMBERS = [
    // Upper Right (18-11)
    [18, 17, 16, 15, 14, 13, 12, 11],
    // Upper Left (21-28)
    [21, 22, 23, 24, 25, 26, 27, 28],
    // Lower Right (48-41)
    [48, 47, 46, 45, 44, 43, 42, 41],
    // Lower Left (31-38)
    [31, 32, 33, 34, 35, 36, 37, 38],
];

interface ToothProps {
    number: number;
    status: string;
    onClick: () => void;
}

const Tooth: React.FC<ToothProps> = ({ number, status, onClick }) => {
    let colorClass = 'bg-white border-slate-300 text-slate-500 hover:border-blue-400';
    
    switch (status) {
        case 'Caries':
            colorClass = 'bg-red-50 border-red-500 text-red-600 shadow-sm';
            break;
        case 'Treated':
            colorClass = 'bg-blue-50 border-blue-500 text-blue-600 shadow-sm';
            break;
        case 'Missing':
            colorClass = 'bg-slate-100 border-slate-200 text-slate-300 opacity-60';
            break;
        case 'Crown':
            colorClass = 'bg-yellow-50 border-yellow-500 text-yellow-700 shadow-sm';
            break;
        case 'RootCanal':
            colorClass = 'bg-purple-50 border-purple-500 text-purple-700 shadow-sm';
            break;
        default:
            // Healthy
            break;
    }

    return (
        <div 
            onClick={onClick}
            className={`w-9 h-12 flex flex-col items-center justify-center border-2 rounded-t-lg rounded-b-md cursor-pointer transition-all duration-200 active:scale-95 ${colorClass}`}
            title={`Dent ${number} - ${status || 'Sain'}`}
        >
            <span className="text-[10px] font-bold select-none">{number}</span>
            {status === 'Caries' && <div className="w-2 h-2 rounded-full bg-red-500 mt-1"></div>}
            {status === 'Treated' && <div className="w-2 h-2 rounded-full bg-blue-500 mt-1"></div>}
            {status === 'Crown' && <div className="w-full h-1 bg-yellow-500 mt-1"></div>}
        </div>
    );
};

interface OdontogramProps {
    statusMap: Record<number, string>;
    onToothClick: (number: number) => void;
    readOnly?: boolean;
}

export const Odontogram: React.FC<OdontogramProps> = ({ statusMap, onToothClick, readOnly = false }) => {
  return (
    <div className="max-w-3xl mx-auto py-4 select-none">
        {/* Upper Arch */}
        <div className="flex justify-center gap-2 md:gap-4 pb-6 border-b border-slate-100 relative">
            <div className="flex gap-1 md:gap-2 flex-row-reverse">
                {TEETH_NUMBERS[0].map(n => (
                    <Tooth key={n} number={n} status={statusMap[n]} onClick={() => !readOnly && onToothClick(n)} />
                ))}
            </div>
            <div className="w-px bg-slate-200 h-16 self-end"></div>
            <div className="flex gap-1 md:gap-2">
                {TEETH_NUMBERS[1].map(n => (
                    <Tooth key={n} number={n} status={statusMap[n]} onClick={() => !readOnly && onToothClick(n)} />
                ))}
            </div>
            <div className="absolute -right-4 top-0 text-xs text-slate-300 font-bold uppercase rotate-90 origin-top-left mt-2">Haut</div>
        </div>

        {/* Lower Arch */}
        <div className="flex justify-center gap-2 md:gap-4 pt-6 relative">
            <div className="flex gap-1 md:gap-2 flex-row-reverse">
                {TEETH_NUMBERS[2].map(n => (
                    <Tooth key={n} number={n} status={statusMap[n]} onClick={() => !readOnly && onToothClick(n)} />
                ))}
            </div>
            <div className="w-px bg-slate-200 h-16 self-start"></div>
            <div className="flex gap-1 md:gap-2">
                {TEETH_NUMBERS[3].map(n => (
                    <Tooth key={n} number={n} status={statusMap[n]} onClick={() => !readOnly && onToothClick(n)} />
                ))}
            </div>
            <div className="absolute -right-4 bottom-0 text-xs text-slate-300 font-bold uppercase rotate-90 origin-bottom-left mb-2">Bas</div>
        </div>
    </div>
  );
};
