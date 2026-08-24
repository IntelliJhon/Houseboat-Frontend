import React from 'react';
import { RatingStars } from './RatingStars';
import { Sparkles, ThumbsUp, ShieldCheck, HeartHandshake, Utensils, Armchair, BadgePercent } from 'lucide-react';
import type { RatingBreakdownSummary } from '../../services/reviewService';

interface RatingBreakdownProps {
  breakdown: RatingBreakdownSummary;
}

export const RatingBreakdown: React.FC<RatingBreakdownProps> = ({ breakdown }) => {
  const { overallAverage, totalReviews, categoryAverages, distribution, recommendationPercentage } = breakdown;

  const categories = [
    { label: 'Cleanliness & Hygiene', value: categoryAverages.cleanliness, icon: <ShieldCheck className="w-4 h-4 text-emerald-500" /> },
    { label: 'Hospitality & Crew Care', value: categoryAverages.hospitality, icon: <HeartHandshake className="w-4 h-4 text-rose-500" /> },
    { label: 'Food & Culinary Taste', value: categoryAverages.food, icon: <Utensils className="w-4 h-4 text-amber-500" /> },
    { label: 'Cabin Comfort & Amenities', value: categoryAverages.comfort, icon: <Armchair className="w-4 h-4 text-indigo-500" /> },
    { label: 'Value For Money', value: categoryAverages.valueForMoney, icon: <BadgePercent className="w-4 h-4 text-purple-500" /> },
  ];

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-premium space-y-6">
      
      {/* Top Banner: Score + Recommendation % */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
        
        {/* Rating Large Display */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-3xl bg-slate-900 text-white flex flex-col items-center justify-center shadow-lg shrink-0">
            <span className="font-heading text-3xl font-extrabold">{overallAverage.toFixed(1)}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">out of 5</span>
          </div>

          <div className="space-y-1">
            <RatingStars rating={overallAverage} size="lg" />
            <h3 className="font-heading text-base font-extrabold text-primary-deep flex items-center gap-1.5">
              Guest Reviews Summary <Sparkles className="w-4 h-4 text-accent-gold" />
            </h3>
            <p className="text-xs text-slate-500 font-semibold">
              Based on {totalReviews} verified guest stay{totalReviews !== 1 ? 's' : ''} on b4boat
            </p>
          </div>
        </div>

        {/* Recommendation Badge */}
        {totalReviews > 0 && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3 shrink-0">
            <div className="p-2.5 rounded-xl bg-emerald-500 text-white shadow-xs">
              <ThumbsUp className="w-5 h-5" />
            </div>
            <div>
              <span className="font-heading text-lg font-extrabold text-emerald-900 block">
                {recommendationPercentage}%
              </span>
              <span className="text-[11px] font-bold text-emerald-700">
                Guests would recommend this vessel
              </span>
            </div>
          </div>
        )}

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Star Rating Distribution Progress Bars (1-5 stars) */}
        <div className="lg:col-span-5 space-y-2.5">
          <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Rating Distribution</h4>
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = distribution[stars as keyof typeof distribution] || 0;
            const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;

            return (
              <div key={stars} className="flex items-center gap-3 text-xs font-bold text-slate-600">
                <span className="w-12 text-right shrink-0">{stars} ★</span>
                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-10 text-slate-400 text-[11px] shrink-0 text-right">{count}</span>
              </div>
            );
          })}
        </div>

        {/* Sub-Category Averages */}
        <div className="lg:col-span-7 space-y-3">
          <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Cruising Quality Breakdown</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categories.map((cat, idx) => (
              <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold">
                <div className="flex items-center gap-2">
                  {cat.icon}
                  <span className="text-slate-700">{cat.label}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-900 font-extrabold">{cat.value.toFixed(1)}</span>
                  <span className="text-amber-400 text-xs">★</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
