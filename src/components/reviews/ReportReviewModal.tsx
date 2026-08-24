import React, { useState } from 'react';
import { X, Flag, AlertTriangle, Loader2 } from 'lucide-react';
import { reviewService } from '../../services/reviewService';
import type { ReviewItem } from '../../services/reviewService';
import toast from 'react-hot-toast';

interface ReportReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: ReviewItem | null;
}

export const ReportReviewModal: React.FC<ReportReviewModalProps> = ({
  isOpen,
  onClose,
  review,
}) => {
  const [reason, setReason] = useState('Spam or misleading content');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !review) return null;

  const reasons = [
    'Spam or misleading content',
    'Inappropriate language or profanity',
    'Fake stay or false claims',
    'Personal info exposure / Privacy violation',
    'Unrelated to houseboat experience',
    'Other compliance violation',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await reviewService.reportReview(review.id, reason, description.trim() || undefined);
      toast.success('Review has been reported to b4boat moderators.');
      onClose();
      setDescription('');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to report review.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 text-rose-600 font-extrabold text-base">
            <AlertTriangle className="w-5 h-5" />
            <span>Report Review</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
              Reason for Reporting *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none"
            >
              {reasons.map((r, idx) => (
                <option key={idx} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
              Additional Details (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Provide context for admin moderation..."
              maxLength={1000}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-900 focus:outline-none"
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
              className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Flag className="w-4 h-4" /> Submit Report
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
