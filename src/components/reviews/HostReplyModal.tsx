import React, { useState } from 'react';
import { X, MessageSquare, Loader2, Sparkles } from 'lucide-react';
import { reviewService } from '../../services/reviewService';
import type { ReviewItem } from '../../services/reviewService';
import toast from 'react-hot-toast';

interface HostReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: ReviewItem | null;
  onSuccess: () => void;
}

export const HostReplyModal: React.FC<HostReplyModalProps> = ({
  isOpen,
  onClose,
  review,
  onSuccess,
}) => {
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !review) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || replyText.trim().length < 5) {
      toast.error('Host response must be at least 5 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      await reviewService.addHostReply(review.id, replyText.trim());
      toast.success('Your host response has been posted!');
      onSuccess();
      onClose();
      setReplyText('');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to submit host response.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="space-y-0.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> Host Communication
            </span>
            <h3 className="font-heading text-base font-extrabold text-slate-900">
              Reply to {review.customerName}'s Review
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Original Review Preview */}
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1 text-xs">
          <div className="flex justify-between items-center font-bold text-slate-800">
            <span>"{review.title}"</span>
            <span className="text-amber-500 font-extrabold">{review.overallRating.toFixed(1)} ★</span>
          </div>
          <p className="text-slate-600 line-clamp-3 font-medium font-sans">
            {review.review}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
              Official Host Response *
            </label>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={4}
              placeholder="Thank the guest for staying with you, address their comments, and invite them back..."
              minLength={5}
              maxLength={1500}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-secondary-emerald/20 focus:border-secondary-emerald"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-primary-deep hover:bg-primary-light text-white font-bold rounded-2xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <MessageSquare className="w-4 h-4 text-accent-gold" /> Post Response
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
