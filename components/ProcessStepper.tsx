import React from 'react';

export interface ProcessStep {
  id: string;
  title: string;
  description?: React.ReactNode;
  date?: string;
  icon?: React.ReactNode;
  status: 'completed' | 'current' | 'upcoming';
}

interface ProcessStepperProps {
  steps: ProcessStep[];
  className?: string;
}

export const ProcessStepper: React.FC<ProcessStepperProps> = ({ steps, className = '' }) => {
  return (
    <div className={`flex flex-col ${className}`}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        return (
          <div key={step.id} className="flex gap-5 group">
            <div className="flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                  step.status === 'completed'
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200/50'
                    : step.status === 'current'
                      ? 'bg-white border-blue-600 text-blue-600 ring-4 ring-blue-50 shadow-sm'
                      : 'bg-slate-50 border-slate-200/60 text-slate-400'
                }`}
              >
                {step.icon ? (
                  step.icon
                ) : step.status === 'completed' ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <span className="text-[10px] font-bold leading-none">{index + 1}</span>
                )}
              </div>
              {!isLast && (
                <div
                  className={`w-0.5 h-full my-2 rounded-full ${
                    step.status === 'completed'
                      ? 'bg-blue-600/80 shadow-[0_0_8px_rgba(37,99,235,0.4)]'
                      : 'bg-slate-200/60'
                  }`}
                />
              )}
            </div>
            <div className={`flex-1 pb-8 ${index === 0 ? 'pt-1' : ''}`}>
              <div className="flex items-center justify-between gap-4">
                <h4
                  className={`text-[0.875rem] font-bold tracking-tight ${step.status === 'upcoming' ? 'text-slate-400' : 'text-slate-900'}`}
                >
                  {step.title}
                </h4>
                {step.date && (
                  <span className="text-[0.65rem] text-slate-400 font-bold uppercase tracking-[0.1em]">
                    {step.date}
                  </span>
                )}
              </div>
              {step.description && (
                <div className="text-[0.8125rem] text-slate-500 font-medium mt-1 leading-relaxed">
                  {step.description}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
