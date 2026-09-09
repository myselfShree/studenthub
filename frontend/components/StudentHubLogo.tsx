import React from 'react';
import Image from 'next/image';

interface StudentHubLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  textSize?: string;
}

export default function StudentHubLogo({
  size = 28,
  className = '',
  showText = true,
  textSize = 'text-sm'
}: StudentHubLogoProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div 
        className="relative flex-shrink-0 overflow-hidden rounded-md border border-[#36362F] bg-[#1C1C17] flex items-center justify-center p-0.5"
        style={{ width: size, height: size }}
      >
        <Image 
          src="/logo.png" 
          alt="Student Hub Logo" 
          width={size} 
          height={size} 
          className="object-contain"
          priority
        />
      </div>
      {showText && (
        <span className={`font-display font-bold tracking-tight text-[#FFFBF4] ${textSize}`}>
          Student Hub
        </span>
      )}
    </div>
  );
}
