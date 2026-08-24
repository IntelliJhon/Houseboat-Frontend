import React, { useState, useEffect } from 'react';
import { Star, Quote, ShieldCheck } from 'lucide-react';
import { reviewService } from '../../services/reviewService';
import type { ReviewItem } from '../../services/reviewService';

const fallbackReviews = [
  {
    name: 'Vikram Malhotra',
    location: 'Mumbai, India',
    rating: 5,
    date: 'June 2026',
    comment: 'Staying on the Grandeur Overwater Cruise was an absolute dream. Waking up to the serene Alleppey backwaters and having fresh karimeen fry prepared by the private chef was incomparable.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80',
  },
  {
    name: 'Sarah Jenkins',
    location: 'London, UK',
    rating: 5,
    date: 'May 2026',
    comment: 'The booking flow on b4boat was seamless. We got instant confirmation for our honeymoon trip in Kumarakom. Highly recommend the golden hour sun deck lounge views!',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80',
  },
  {
    name: 'Arjun Nair',
    location: 'Kochi, India',
    rating: 5,
    date: 'April 2026',
    comment: 'A truly luxurious experience for the whole family. Kids loved watching the bird sanctuaries and coconut palms drift by. The local crew went out of their way to support our needs.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&h=100&q=80',
  },
];

const CustomerReviews: React.FC = () => {
  const [liveReviews, setLiveReviews] = useState<ReviewItem[]>([]);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const fetched = await reviewService.getFeaturedReviews(6);
        setLiveReviews(fetched);
      } catch (err) {
        console.error('Failed to load featured reviews:', err);
      }
    };
    loadReviews();
  }, []);

  const displayReviews = liveReviews.length > 0 ? liveReviews.map((r) => ({
    name: r.customerName,
    location: r.houseboatName,
    rating: Math.round(r.overallRating),
    date: new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    comment: r.review,
    avatar: r.customerAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80',
  })) : fallbackReviews;

  return (
    <section className="py-16 bg-slate-50" id="reviews">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
          <div className="inline-block bg-secondary-emerald/10 text-secondary-emerald text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Guest Testimonials
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-primary-deep">
            Loved By Premium Travelers
          </h2>
          <p className="text-slate-500 text-base">
            Read stories of unmatched comfort and backwater exploration shared by our global guests.
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayReviews.map((review, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-6 border border-slate-100 hover:shadow-premium transition-all duration-300 relative flex flex-col justify-between gap-6"
            >
              {/* Quote Icon Overlay */}
              <Quote className="absolute top-6 right-6 w-8 h-8 text-slate-100" />
              
              <div className="space-y-4">
                {/* Stars */}
                <div className="flex gap-0.5">
                  {Array.from({ length: review.rating }).map((_, sIdx) => (
                    <Star key={sIdx} className="w-4 h-4 fill-accent-gold text-accent-gold" />
                  ))}
                </div>

                {/* Comment */}
                <p className="text-slate-600 text-sm leading-relaxed italic">
                  "{review.comment}"
                </p>
              </div>

              {/* Reviewer Meta */}
              <div className="flex items-center gap-3 border-t border-slate-50 pt-4">
                <img
                  src={review.avatar}
                  alt={review.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-100"
                />
                <div>
                  <h4 className="font-heading text-sm font-bold text-primary-deep flex items-center gap-1">
                    {review.name}
                    {liveReviews.length > 0 && <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />}
                  </h4>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">
                    {review.location} • {review.date}
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default CustomerReviews;
