import React, { useId } from 'react';
import { cn } from '@/lib/utils';

export function Logo({ className, strokeWidth = 2 }: { className?: string, strokeWidth?: number | string }) {
  const id = useId().replace(/:/g, "");
  const patternId = `checker-${id}`;
  
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("lucide", className)}
    >
      <defs>
        <pattern id={patternId} x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
          <rect x="0" y="0" width="4" height="4" fill="#ffffff" stroke="none" />
          <rect x="4" y="0" width="4" height="4" fill="#e5e5e5" stroke="none" />
          <rect x="0" y="4" width="4" height="4" fill="#e5e5e5" stroke="none" />
          <rect x="4" y="4" width="4" height="4" fill="#ffffff" stroke="none" />
        </pattern>
      </defs>
      
      {/* Eye shape (Look) filled with checkerboard */}
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" fill={`url(#${patternId})`} />
      
      {/* Iris */}
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
