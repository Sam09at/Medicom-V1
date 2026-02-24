import React from 'react';
import { motion } from 'framer-motion';

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface SegmentedTabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const SegmentedTabs: React.FC<SegmentedTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
}) => {
  return (
    <div
      className={`flex items-center gap-2 border-b border-slate-100 pb-[1px] overflow-x-auto scrollbar-hide ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative px-3 py-2 text-[13px] transition-colors flex items-center gap-2 whitespace-nowrap outline-none ${isActive ? 'text-[#0F0F0F] font-bold' : 'text-slate-400 font-medium hover:text-slate-600'
              }`}
          >
            {tab.icon && (
              <span className={`w-4 h-4 ${isActive ? 'text-[#0F0F0F]' : 'text-slate-400'}`}>
                {tab.icon}
              </span>
            )}
            <span>{tab.label}</span>
            {isActive && (
              <motion.div
                layoutId="segmented-tab-indicator"
                className="absolute bottom-[-2px] left-0 right-0 h-[2px] bg-[#0F0F0F]"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};
