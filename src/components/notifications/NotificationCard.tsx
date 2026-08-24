import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, CreditCard, Ship, CheckCircle2, 
  Star, Wrench, MessageSquare, Info, ArrowRight, Trash2, Check 
} from 'lucide-react';
import type { NotificationItem } from '../../services/notificationService';
import { useAuth } from '../../context/AuthContext';

interface NotificationCardProps {
  notification: NotificationItem;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClickAction?: () => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
  onClickAction,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const getCategoryIcon = (type: string, customIcon?: string | null) => {
    if (customIcon === 'Ship' || type === 'HOUSEBOAT') return <Ship className="w-4 h-4 text-sky-600" />;
    if (type === 'BOOKING' || type === 'CALENDAR') return <Calendar className="w-4 h-4 text-emerald-600" />;
    if (type === 'PAYMENT') return <CreditCard className="w-4 h-4 text-amber-600" />;
    if (type === 'APPROVAL') return <CheckCircle2 className="w-4 h-4 text-indigo-600" />;
    if (type === 'MAINTENANCE') return <Wrench className="w-4 h-4 text-purple-600" />;
    if (type === 'REVIEW') return <Star className="w-4 h-4 text-yellow-500" />;
    if (type === 'MESSAGE') return <MessageSquare className="w-4 h-4 text-blue-600" />;
    return <Info className="w-4 h-4 text-slate-500" />;
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-100 text-rose-700 uppercase tracking-wider">Critical</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-100 text-amber-800 uppercase tracking-wider">High</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wider">Medium</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-slate-100 text-slate-600 uppercase tracking-wider">Low</span>;
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay === 1) return 'Yesterday';
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getActionButtonText = (type: string, actionUrl?: string | null) => {
    if (type === 'PAYMENT' || actionUrl?.includes('revenue')) return 'View Earnings';
    if (type === 'BOOKING' || actionUrl?.includes('booking')) return 'View Booking';
    if (type === 'HOUSEBOAT' || type === 'APPROVAL' || actionUrl?.includes('houseboat')) return 'View Listing';
    if (type === 'CALENDAR' || actionUrl?.includes('calendar')) return 'View Calendar';
    if (type === 'REVIEW' || actionUrl?.includes('review')) return 'View Review';
    if (actionUrl) return 'View Details';
    return null;
  };

  const navigateToDestination = (targetHashOrUrl: string) => {
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
    if (onClickAction) onClickAction();

    if (user?.role === 'HOST') {
      const targetHash = targetHashOrUrl.startsWith('#') ? targetHashOrUrl : `#${targetHashOrUrl}`;
      window.location.hash = targetHash;
      navigate(`/host/dashboard${targetHash}`);
      window.dispatchEvent(new CustomEvent('b4boat_navigate_tab', { detail: targetHash }));
      return;
    }

    if (user?.role === 'ADMIN') {
      navigate('/admin/dashboard');
      return;
    }

    if (targetHashOrUrl.startsWith('#')) {
      navigate('/dashboard');
    } else {
      navigate(targetHashOrUrl);
    }
  };

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();

    // 1. PAYMENT -> Redirect to Revenue page (#revenue)
    if (
      notification.type === 'PAYMENT' || 
      notification.actionUrl === '#revenue' || 
      notification.actionUrl?.includes('revenue') ||
      notification.title.toLowerCase().includes('payment')
    ) {
      navigateToDestination('#revenue');
      return;
    }

    // 2. BOOKING -> Redirect to Bookings section (#bookings)
    if (
      notification.type === 'BOOKING' || 
      notification.actionUrl === '#bookings' || 
      notification.actionUrl?.includes('booking') ||
      notification.title.toLowerCase().includes('booking') ||
      notification.title.toLowerCase().includes('reservation')
    ) {
      navigateToDestination('#bookings');
      return;
    }

    // 3. HOUSEBOAT / APPROVAL -> Redirect to My Houseboats (#houseboats)
    if (
      notification.type === 'HOUSEBOAT' || 
      notification.type === 'APPROVAL' || 
      notification.actionUrl === '#houseboats' ||
      notification.actionUrl?.includes('houseboat')
    ) {
      navigateToDestination('#houseboats');
      return;
    }

    // 4. CALENDAR -> Redirect to Operations Calendar (#calendar)
    if (notification.type === 'CALENDAR' || notification.actionUrl === '#calendar') {
      navigateToDestination('#calendar');
      return;
    }

    // 5. REVIEW -> Redirect to Reviews (#reviews)
    if (notification.type === 'REVIEW' || notification.actionUrl === '#reviews') {
      navigateToDestination('#reviews');
      return;
    }

    if (notification.actionUrl) {
      navigateToDestination(notification.actionUrl);
    } else {
      navigateToDestination('#bookings');
    }
  };

  const handleCardClick = () => {
    if (
      notification.type === 'PAYMENT' || 
      notification.actionUrl === '#revenue' || 
      notification.actionUrl?.includes('revenue') ||
      notification.title.toLowerCase().includes('payment')
    ) {
      navigateToDestination('#revenue');
      return;
    }

    if (
      notification.type === 'BOOKING' || 
      notification.actionUrl === '#bookings' || 
      notification.actionUrl?.includes('booking') ||
      notification.title.toLowerCase().includes('booking') ||
      notification.title.toLowerCase().includes('reservation')
    ) {
      navigateToDestination('#bookings');
      return;
    }

    if (
      notification.type === 'HOUSEBOAT' || 
      notification.type === 'APPROVAL' || 
      notification.actionUrl === '#houseboats' ||
      notification.actionUrl?.includes('houseboat')
    ) {
      navigateToDestination('#houseboats');
      return;
    }

    if (notification.type === 'CALENDAR' || notification.actionUrl === '#calendar') {
      navigateToDestination('#calendar');
      return;
    }

    if (notification.type === 'REVIEW' || notification.actionUrl === '#reviews') {
      navigateToDestination('#reviews');
      return;
    }

    if (notification.actionUrl) {
      navigateToDestination(notification.actionUrl);
    } else {
      navigateToDestination('#bookings');
    }
  };

  const actionBtnText = getActionButtonText(notification.type, notification.actionUrl);

  return (
    <div
      onClick={handleCardClick}
      className={`relative p-4 rounded-2xl border transition-all cursor-pointer group ${
        !notification.isRead
          ? 'bg-slate-50/80 border-slate-200/90 shadow-sm hover:border-slate-300'
          : 'bg-white border-slate-100 hover:bg-slate-50/50'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Category Icon Badge */}
        <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-xs shrink-0 mt-0.5">
          {getCategoryIcon(notification.type, notification.icon)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className={`text-xs sm:text-sm font-extrabold ${!notification.isRead ? 'text-slate-900' : 'text-slate-700'}`}>
                {notification.title}
              </h4>
              {getPriorityBadge(notification.priority)}
            </div>

            {/* Unread Indicator & Time */}
            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
              {!notification.isRead && (
                <span className="w-2 h-2 rounded-full bg-secondary-emerald animate-pulse" />
              )}
              <span className="text-[10px] font-semibold text-slate-400">
                {formatRelativeTime(notification.createdAt)}
              </span>
            </div>
          </div>

          <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed font-sans line-clamp-2">
            {notification.message}
          </p>

          {/* Card Footer Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100/60 mt-2">
            {actionBtnText ? (
              <button
                type="button"
                onClick={handleAction}
                className="inline-flex items-center gap-1 text-[11px] font-extrabold text-primary-deep hover:text-secondary-emerald transition-colors cursor-pointer"
              >
                {actionBtnText} <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
              {!notification.isRead && onMarkAsRead && (
                <button
                  type="button"
                  title="Mark as read"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAsRead(notification.id);
                  }}
                  className="p-1.5 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  title="Delete notification"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(notification.id);
                  }}
                  className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
