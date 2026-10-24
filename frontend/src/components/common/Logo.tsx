import React from 'react';
import { Shield, FileText, CheckCircle2 } from 'lucide-react';

interface LogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'light',
  size = 'md',
  showTagline = false,
}) => {
  const isDark = variant === 'dark';

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div className="flex items-center gap-3 select-none">
      <div className={`relative flex items-center justify-center rounded-xl p-2 transition-transform hover:scale-105 ${
        isDark 
          ? 'bg-[#4B342B] text-[#FFFDF9] border border-[#B8875B]/30 shadow-subtle' 
          : 'bg-[#3B2923] text-[#FFFDF9] shadow-card'
      }`}>
        {/* Shield outline */}
        <Shield className={`${iconSizes[size]} text-[#B8875B] fill-[#3B2923]/40`} strokeWidth={2} />
        
        {/* Document in center */}
        <FileText className="absolute w-3.5 h-3.5 text-[#FFFDF9]" strokeWidth={2.5} />
        
        {/* Verification Check Badge */}
        <div className="absolute -bottom-1 -right-1 bg-[#397451] rounded-full p-0.5 border border-[#FFFDF9]">
          <CheckCircle2 className="w-2.5 h-2.5 text-white" strokeWidth={3} />
        </div>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className={`font-display font-bold tracking-tight ${textSizes[size]} ${
            isDark ? 'text-[#FFFDF9]' : 'text-[#3B2923]'
          }`}>
            Evi<span className="text-[#B8875B]">Lock</span>
          </span>
          <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-[#B8875B]/20 text-[#B8875B] border border-[#B8875B]/30">
            LEGAL GRADE
          </span>
        </div>
        {showTagline && (
          <span className={`text-xs font-medium tracking-wide ${
            isDark ? 'text-[#E5D7C8]/80' : 'text-[#88776B]'
          }`}>
            Protecting Evidence. Preserving Trust.
          </span>
        )}
      </div>
    </div>
  );
};
