import React from 'react';
import { BellOff } from 'lucide-react';

interface NotificationEmptyStateProps {
  title?: string;
  message?: string;
}

export const NotificationEmptyState: React.FC<NotificationEmptyStateProps> = ({
  title = 'No Notifications Yet',
  message = 'You are all caught up! New system alerts, booking updates, and messages will appear here in real-time.',
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-3 my-4">
      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200/60 shadow-inner">
        <BellOff className="w-6 h-6" />
      </div>
      <h4 className="font-heading text-sm font-bold text-slate-800">{title}</h4>
      <p className="text-xs text-slate-400 font-sans max-w-xs leading-relaxed">{message}</p>
    </div>
  );
};
