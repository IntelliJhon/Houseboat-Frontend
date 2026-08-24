import React, { useState } from 'react';
import { 
  ShieldCheck, ThumbsUp, Flag, MessageSquare, 
  User, Calendar, Edit3 
} from 'lucide-react';
import { RatingStars } from './RatingStars';
import type { ReviewItem } from '../../services/reviewService';
import { reviewService } from '../../services/reviewService';
import toast from 'react-hot-toast';

interface ReviewCardProps {
  review: ReviewItem;
  onEdit?: (review: ReviewItem) => void;
  onHostReplyClick?: (review: ReviewItem) => void;
  onReportClick?: (review: ReviewItem) => void;
  showHostReplyOption?: boolean;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  onEdit,
  onHostReplyClick,
  onReportClick,
  showHostReplyOption = false,
}) => {
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount);
  const [isHelpful, setIsHelpful] = useState(review.isHelpfulByCurrentUser || false);
  const [isVoting, setIsVoting] = useState(false);
  const [activeImagePreview, setActiveImagePreview] = useState<string | null>(null);

  const handleToggleHelpful = async () => {
    if (isVoting) return;
    setIsVoting(true);
    try {
      const res = await reviewService.toggleHelpful(review.id);
      setHelpfulCount(res.helpfulCount);
      setIsHelpful(res.isHelpful);
      toast.success(res.isHelpful ? 'Marked review as helpful!' : 'Removed helpful vote.');
    } catch (err: any) {
      toast.error('Please sign in to vote on reviews.');
    } finally {
      setIsVoting(false);
    }
  };

  const formattedTravelDate = new Date(review.travelDate).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-premium space-y-4 transition-all hover:border-slate-200">
      
      {/* Reviewer Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-50">
        <div className="flex items-center gap-3">
          {review.customerAvatar ? (
            <img
              src={review.customerAvatar}
              alt={review.customerName}
              className="w-11 h-11 rounded-2xl object-cover border border-slate-200 shadow-xs"
            />
          ) : (
            <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center shadow-xs">
              {review.anonymous ? <User className="w-5 h-5" /> : review.customerName.charAt(0)}
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-heading text-sm font-extrabold text-slate-900">{review.customerName}</h4>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-[10px] border border-emerald-100">
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified Stay
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
              <Calendar className="w-3 h-3" /> Traveled {formattedTravelDate}
            </span>
          </div>
        </div>

        {/* Rating Score & Edit Button */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <RatingStars rating={review.overallRating} size="md" />
            <span className="px-2 py-1 bg-amber-50 text-amber-800 rounded-xl font-extrabold text-xs border border-amber-200/60">
              {review.overallRating.toFixed(1)}
            </span>
          </div>

          {review.isEditable && onEdit && (
            <button
              type="button"
              onClick={() => onEdit(review)}
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer border border-slate-200"
              title="Edit review (available within 24h)"
            >
              <Edit3 className="w-3.5 h-3.5 text-secondary-emerald" /> Edit
            </button>
          )}
        </div>
      </div>

      {/* Category Scores Pills */}
      <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-600">
        <span className="px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-xl">
          Cleanliness: {review.cleanlinessRating.toFixed(1)}★
        </span>
        <span className="px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-xl">
          Hospitality: {review.hospitalityRating.toFixed(1)}★
        </span>
        <span className="px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-xl">
          Food: {review.foodRating.toFixed(1)}★
        </span>
        <span className="px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-xl">
          Comfort: {review.comfortRating.toFixed(1)}★
        </span>
        <span className="px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-xl">
          Value: {review.valueForMoneyRating.toFixed(1)}★
        </span>
      </div>

      {/* Review Title & Content */}
      <div className="space-y-2">
        <h3 className="font-heading text-sm font-extrabold text-primary-deep">{review.title}</h3>
        <p className="text-xs text-slate-700 leading-relaxed font-sans font-medium whitespace-pre-line">
          {review.review}
        </p>
      </div>

      {/* Pros & Cons */}
      {(review.pros || review.cons) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {review.pros && (
            <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-2xl space-y-1">
              <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">
                👍 What I Liked
              </span>
              <p className="text-xs text-emerald-900 font-sans font-semibold">{review.pros}</p>
            </div>
          )}
          {review.cons && (
            <div className="p-3 bg-rose-50/60 border border-rose-100 rounded-2xl space-y-1">
              <span className="text-[10px] font-extrabold text-rose-800 uppercase tracking-wider block">
                💡 Room for Improvement
              </span>
              <p className="text-xs text-rose-900 font-sans font-semibold">{review.cons}</p>
            </div>
          )}
        </div>
      )}

      {/* Photo Gallery Grid */}
      {review.images && review.images.length > 0 && (
        <div className="space-y-2 pt-2">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
            Guest Photos ({review.images.length})
          </span>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {review.images.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt={`Review photo ${idx + 1}`}
                onClick={() => setActiveImagePreview(url)}
                className="w-20 h-20 rounded-2xl object-cover border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity shrink-0 shadow-xs"
              />
            ))}
          </div>
        </div>
      )}

      {/* Host Reply Card */}
      {review.hostReply && (
        <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2 border border-slate-800 mt-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-accent-gold flex items-center gap-1.5 uppercase tracking-wider">
              <MessageSquare className="w-3.5 h-3.5" /> Official Host Response
            </span>
            {review.hostRepliedAt && (
              <span className="text-[10px] text-slate-400">
                {new Date(review.hostRepliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-200 leading-relaxed font-sans font-medium">
            "{review.hostReply}"
          </p>
        </div>
      )}

      {/* Footer Controls: Helpful & Report */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
        <button
          type="button"
          onClick={handleToggleHelpful}
          disabled={isVoting}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            isHelpful
              ? 'bg-secondary-emerald text-white shadow-xs'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <ThumbsUp className="w-3.5 h-3.5" /> Helpful ({helpfulCount})
        </button>

        <div className="flex items-center gap-2">
          {showHostReplyOption && !review.hostReply && onHostReplyClick && (
            <button
              type="button"
              onClick={() => onHostReplyClick(review)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1"
            >
              <MessageSquare className="w-3.5 h-3.5 text-accent-gold" /> Reply as Host
            </button>
          )}

          {onReportClick && (
            <button
              type="button"
              onClick={() => onReportClick(review)}
              className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer rounded-lg hover:bg-rose-50"
              title="Report inappropriate review"
            >
              <Flag className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Image Preview Lightbox Modal */}
      {activeImagePreview && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActiveImagePreview(null)}
        >
          <img
            src={activeImagePreview}
            alt="Preview"
            className="max-w-4xl max-h-[85vh] rounded-3xl object-contain shadow-2xl border border-slate-700"
          />
        </div>
      )}

    </div>
  );
};
