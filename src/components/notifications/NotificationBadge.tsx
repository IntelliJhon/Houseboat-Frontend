import React from 'react';

interface NotificationBadgeProps {
  count: number;
  className?: string;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({ count, className = '' }) => {
  if (count <= 0) return null;

  const displayCount = count > 99 ? '99+' : count;

  return (
    <span
      className={`inline-flex items-center justify-center bg-rose-500 text-white font-extrabold rounded-full px-1.5 py-0.5 text-[10px] min-w-[18px] h-[18px] border-2 border-white shadow-sm animate-in zoom-in-50 duration-200 ${className}`}
    >
      {displayCount}
    </span>
  );
};
