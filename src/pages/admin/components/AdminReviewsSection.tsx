import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Sparkles, CheckCircle2, EyeOff, Trash2, 
  Flag, RefreshCcw 
} from 'lucide-react';
import { reviewService } from '../../../services/reviewService';
import type { ReviewItem } from '../../../services/reviewService';
import { ReviewCard } from '../../../components/reviews/ReviewCard';
import toast from 'react-hot-toast';

export const AdminReviewsSection: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterTab, setFilterTab] = useState<'all' | 'reported' | 'low' | 'hidden'>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchAdminReviews = async () => {
    setIsLoading(true);
    try {
      let statusParam: string | undefined;
      let minRatingParam: number | undefined;

      if (filterTab === 'reported') statusParam = 'REPORTED';
      if (filterTab === 'hidden') statusParam = 'HIDDEN';
      if (filterTab === 'low') minRatingParam = 3;

      const res = await reviewService.getAdminReviews({
        status: statusParam,
        minRating: minRatingParam,
      });

      setReviews(res.reviews);
    } catch (err) {
      console.error('Failed to load admin review moderation:', err);
      toast.error('Failed to load review moderation queue.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminReviews();
  }, [filterTab]);

  const handleUpdateStatus = async (reviewId: string, status: string) => {
    setActionLoadingId(reviewId);
    try {
      await reviewService.updateReviewStatus(reviewId, status);
      toast.success(`Review status updated to ${status}.`);
      await fetchAdminReviews();
    } catch (err: any) {
      toast.error('Failed to update review status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this review?')) return;
    setActionLoadingId(reviewId);
    try {
      await reviewService.deleteReview(reviewId);
      toast.success('Review permanently deleted.');
      await fetchAdminReviews();
    } catch (err: any) {
      toast.error('Failed to delete review.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Executive Control Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-[11px] font-bold uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5" /> Moderation Desk
          </div>
          <h2 className="font-heading text-2xl font-extrabold flex items-center gap-2">
            Review Moderation & Trust Center <Sparkles className="w-5 h-5 text-accent-gold" />
          </h2>
          <p className="text-xs text-slate-400 font-sans">
            Monitor reported feedback, spam signals, profanity flags, and maintain platform review integrity.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchAdminReviews}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 border border-slate-700"
        >
          <RefreshCcw className="w-4 h-4 text-emerald-400" /> Sync Moderation Stream
        </button>
      </div>

      {/* Filter Tabs Bar */}
      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-premium flex flex-wrap items-center gap-2">
        {[
          { key: 'all', label: 'All Reviews' },
          { key: 'reported', label: 'Reported Reviews' },
          { key: 'low', label: 'Low Ratings (≤ 3★)' },
          { key: 'hidden', label: 'Hidden Reviews' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilterTab(tab.key as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterTab === tab.key
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Review Moderation Feed */}
      {isLoading ? (
        <div className="py-16 text-center space-y-3 bg-white rounded-3xl border border-slate-100 shadow-premium">
          <div className="w-8 h-8 border-3 border-secondary-emerald border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-400">Loading admin moderation stream...</p>
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="relative">
              <ReviewCard review={review} />

              {/* Admin Moderation Bar overlay */}
              <div className="mt-2 p-3 bg-slate-900 text-white rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs font-bold shadow-md">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">Status:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-extrabold ${
                    review.status === 'PUBLISHED'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : review.status === 'REPORTED'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}>
                    {review.status}
                  </span>
                  {review.reportedCount > 0 && (
                    <span className="text-[10px] text-rose-400 flex items-center gap-1 font-bold">
                      <Flag className="w-3 h-3" /> Flagged {review.reportedCount} time{review.reportedCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {review.status !== 'PUBLISHED' && (
                    <button
                      type="button"
                      disabled={actionLoadingId === review.id}
                      onClick={() => handleUpdateStatus(review.id, 'PUBLISHED')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Publish
                    </button>
                  )}

                  {review.status !== 'HIDDEN' && (
                    <button
                      type="button"
                      disabled={actionLoadingId === review.id}
                      onClick={() => handleUpdateStatus(review.id, 'HIDDEN')}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-bold rounded-xl transition-all cursor-pointer border border-slate-700 flex items-center gap-1"
                    >
                      <EyeOff className="w-3.5 h-3.5" /> Hide Review
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={actionLoadingId === review.id}
                    onClick={() => handleDeleteReview(review.id)}
                    className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-[11px] font-bold rounded-xl transition-all cursor-pointer border border-rose-500/40 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Permanently
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center space-y-3 bg-white rounded-3xl border border-slate-100 shadow-premium">
          <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-heading text-sm font-bold text-slate-700">No Reviews in Queue</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            All guest reviews match compliance standards or no flagged reports require attention.
          </p>
        </div>
      )}

    </div>
  );
};
