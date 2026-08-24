import React, { useState, useEffect, useMemo } from 'react';
import { 
  Star, Search, MessageSquare, 
  ThumbsUp, Anchor
} from 'lucide-react';
import { reviewService } from '../../../services/reviewService';
import type { ReviewItem } from '../../../services/reviewService';
import { ReviewCard } from '../../../components/reviews/ReviewCard';
import { HostReplyModal } from '../../../components/reviews/HostReplyModal';
import { ReportReviewModal } from '../../../components/reviews/ReportReviewModal';
import toast from 'react-hot-toast';

export const ReviewsSection: React.FC = () => {
  const [reviewsList, setReviewsList] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [boatFilter, setBoatFilter] = useState('all');

  const [selectedReviewForReply, setSelectedReviewForReply] = useState<ReviewItem | null>(null);
  const [selectedReviewForReport, setSelectedReviewForReport] = useState<ReviewItem | null>(null);

  const fetchHostReviews = async () => {
    setIsLoading(true);
    try {
      const data = await reviewService.getHostReviews();
      setReviewsList(data);
    } catch (err) {
      console.error('Failed to load host reviews:', err);
      toast.error('Could not load guest reviews.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHostReviews();
  }, []);

  // Unique boats list for filter dropdown
  const boatNames = useMemo(() => {
    const names = new Set<string>();
    reviewsList.forEach((r) => {
      if (r.houseboatName) names.add(r.houseboatName);
    });
    return Array.from(names);
  }, [reviewsList]);

  // Dynamic Metrics Calculation
  const metrics = useMemo(() => {
    const total = reviewsList.length;
    if (total === 0) {
      return {
        avgRating: 0,
        total,
        recommendationPct: 0,
        repliedCount: 0,
        responseRatePct: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      };
    }

    const sumRating = reviewsList.reduce((sum, r) => sum + r.overallRating, 0);
    const recommendCount = reviewsList.filter((r) => r.wouldRecommend).length;
    const repliedCount = reviewsList.filter((r) => Boolean(r.hostReply)).length;

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviewsList.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(r.overallRating))) as 1 | 2 | 3 | 4 | 5;
      distribution[star]++;
    });

    return {
      avgRating: Number((sumRating / total).toFixed(1)),
      total,
      recommendationPct: Math.round((recommendCount / total) * 100),
      repliedCount,
      responseRatePct: Math.round((repliedCount / total) * 100),
      distribution,
    };
  }, [reviewsList]);

  // Filtered reviews list
  const filteredReviews = useMemo(() => {
    return reviewsList.filter((r) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = r.customerName.toLowerCase().includes(q);
        const matchesTitle = r.title.toLowerCase().includes(q);
        const matchesReview = r.review.toLowerCase().includes(q);
        const matchesBoat = r.houseboatName.toLowerCase().includes(q);
        if (!matchesName && !matchesTitle && !matchesReview && !matchesBoat) return false;
      }

      if (ratingFilter !== 'all') {
        const targetRating = parseInt(ratingFilter, 10);
        if (Math.round(r.overallRating) !== targetRating) return false;
      }

      if (boatFilter !== 'all' && r.houseboatName !== boatFilter) {
        return false;
      }

      return true;
    });
  }, [reviewsList, searchQuery, ratingFilter, boatFilter]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-extrabold text-primary-deep flex items-center gap-2">
            Guest Reviews & Reputation <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
          </h1>
          <p className="text-xs text-slate-400 font-semibold">
            Track guest feedback, response rates, and vessel performance analytics.
          </p>
        </div>
      </div>

      {/* Analytics Summary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-premium space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Average Guest Rating</span>
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-3xl font-extrabold text-primary-deep">{metrics.avgRating.toFixed(1)}</span>
            <span className="text-xs font-bold text-amber-500">★ ★ ★ ★ ★</span>
          </div>
          <span className="text-[10px] text-slate-400 font-semibold block">From {metrics.total} verified stay{metrics.total !== 1 ? 's' : ''}</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-premium space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Guest Recommendation</span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-heading text-3xl font-extrabold text-emerald-600">{metrics.recommendationPct}%</span>
            <ThumbsUp className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-[10px] text-slate-400 font-semibold block">Would book again</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-premium space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Host Response Rate</span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-heading text-3xl font-extrabold text-indigo-600">{metrics.responseRatePct}%</span>
            <MessageSquare className="w-4 h-4 text-indigo-500" />
          </div>
          <span className="text-[10px] text-slate-400 font-semibold block">{metrics.repliedCount} of {metrics.total} reviews answered</span>
        </div>

        <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-premium space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Reputation Rank</span>
          <span className="font-heading text-2xl font-extrabold text-accent-gold block">Top 5% Partner</span>
          <span className="text-[10px] text-slate-300 font-semibold block">b4boat Kerala Fleet</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-premium space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by guest name, houseboat, or review content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>

            {boatNames.length > 0 && (
              <select
                value={boatFilter}
                onChange={(e) => setBoatFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer max-w-[160px]"
              >
                <option value="all">All Vessels</option>
                {boatNames.map((name, idx) => (
                  <option key={idx} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {isLoading ? (
        <div className="py-16 text-center space-y-3 bg-white rounded-3xl border border-slate-100 shadow-premium">
          <div className="w-8 h-8 border-3 border-secondary-emerald border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-400">Loading guest reviews stream...</p>
        </div>
      ) : filteredReviews.length > 0 ? (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              showHostReplyOption
              onHostReplyClick={setSelectedReviewForReply}
              onReportClick={setSelectedReviewForReport}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center space-y-3 bg-white rounded-3xl border border-slate-100 shadow-premium">
          <Anchor className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-heading text-sm font-bold text-slate-700">No Guest Reviews Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery || ratingFilter !== 'all' || boatFilter !== 'all'
              ? 'Try clearing search filters or rating selections.'
              : 'As guests complete stays on your houseboats, verified reviews will appear here.'}
          </p>
        </div>
      )}

      {/* Host Reply Modal */}
      <HostReplyModal
        isOpen={Boolean(selectedReviewForReply)}
        onClose={() => setSelectedReviewForReply(null)}
        review={selectedReviewForReply}
        onSuccess={fetchHostReviews}
      />

      {/* Report Review Modal */}
      <ReportReviewModal
        isOpen={Boolean(selectedReviewForReport)}
        onClose={() => setSelectedReviewForReport(null)}
        review={selectedReviewForReport}
      />

    </div>
  );
};
