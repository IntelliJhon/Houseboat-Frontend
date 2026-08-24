import React, { useState, useEffect } from 'react';
import { 
  X, Upload, Trash2, Sparkles, 
  CheckCircle2, Loader2 
} from 'lucide-react';
import { RatingStars } from './RatingStars';
import { reviewService } from '../../services/reviewService';
import type { ReviewItem } from '../../services/reviewService';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  houseboatName: string;
  existingReview?: ReviewItem | null;
  onSuccess: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  bookingId,
  houseboatName,
  existingReview,
  onSuccess,
}) => {
  const [overallRating, setOverallRating] = useState<number>(5);
  const [cleanlinessRating, setCleanlinessRating] = useState<number>(5);
  const [hospitalityRating, setHospitalityRating] = useState<number>(5);
  const [foodRating, setFoodRating] = useState<number>(5);
  const [comfortRating, setComfortRating] = useState<number>(5);
  const [valueForMoneyRating, setValueForMoneyRating] = useState<number>(5);

  const [title, setTitle] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [pros, setPros] = useState('');
  const [cons, setCons] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [anonymous, setAnonymous] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (existingReview) {
      setOverallRating(existingReview.overallRating);
      setCleanlinessRating(existingReview.cleanlinessRating);
      setHospitalityRating(existingReview.hospitalityRating);
      setFoodRating(existingReview.foodRating);
      setComfortRating(existingReview.comfortRating);
      setValueForMoneyRating(existingReview.valueForMoneyRating);
      setTitle(existingReview.title);
      setReviewText(existingReview.review);
      setPros(existingReview.pros || '');
      setCons(existingReview.cons || '');
      setWouldRecommend(existingReview.wouldRecommend);
      setAnonymous(existingReview.anonymous);
      setImages(existingReview.images || []);
    } else {
      setOverallRating(5);
      setCleanlinessRating(5);
      setHospitalityRating(5);
      setFoodRating(5);
      setComfortRating(5);
      setValueForMoneyRating(5);
      setTitle('');
      setReviewText('');
      setPros('');
      setCons('');
      setWouldRecommend(true);
      setAnonymous(false);
      setImages([]);
    }
  }, [existingReview, isOpen]);

  if (!isOpen) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (images.length >= 5) {
      toast.error('Maximum of 5 photos allowed per review.');
      return;
    }

    setIsUploading(true);
    const uploadToast = toast.loading('Uploading photo...');

    try {
      const uploadData = new FormData();
      uploadData.append('file', file);

      const res = await api.post('/v1/host/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const url = res.data.data.url;
      setImages((prev) => [...prev, url]);
      toast.dismiss(uploadToast);
      toast.success('Photo uploaded!');
    } catch (err: any) {
      toast.dismiss(uploadToast);
      toast.error('Photo upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || title.length < 3) {
      toast.error('Please enter a review title (min 3 characters).');
      return;
    }
    if (!reviewText.trim() || reviewText.length < 10) {
      toast.error('Please write a review (min 10 characters).');
      return;
    }

    setIsSubmitting(true);
    try {
      if (existingReview) {
        await reviewService.updateReview(existingReview.id, {
          overallRating,
          cleanlinessRating,
          hospitalityRating,
          foodRating,
          comfortRating,
          valueForMoneyRating,
          title: title.trim(),
          review: reviewText.trim(),
          pros: pros.trim() || undefined,
          cons: cons.trim() || undefined,
          wouldRecommend,
          anonymous,
          images,
        });
        toast.success('Your review has been updated!');
      } else {
        await reviewService.createReview({
          bookingId,
          overallRating,
          cleanlinessRating,
          hospitalityRating,
          foodRating,
          comfortRating,
          valueForMoneyRating,
          title: title.trim(),
          review: reviewText.trim(),
          pros: pros.trim() || undefined,
          cons: cons.trim() || undefined,
          wouldRecommend,
          anonymous,
          images,
        });
        toast.success('Thank you! Your review has been published.');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to submit review.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 my-8 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-extrabold uppercase tracking-wider mb-1 border border-amber-200/60">
              <Sparkles className="w-3 h-3 text-amber-500" /> Verified Guest Review
            </div>
            <h3 className="font-heading text-lg font-extrabold text-slate-900">
              {existingReview ? 'Edit Your Review' : `Rate Your Stay: ${houseboatName}`}
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

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Overall Rating Selection */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 text-center space-y-3 shadow-md">
            <span className="text-xs font-extrabold text-amber-400 uppercase tracking-widest block">
              Overall Experience Rating
            </span>
            <div className="flex justify-center">
              <RatingStars
                rating={overallRating}
                size="lg"
                interactive
                onRatingChange={setOverallRating}
              />
            </div>
            <p className="text-xs font-semibold text-slate-300">
              {overallRating === 5 && '🌟 Exceptional! Loved every minute.'}
              {overallRating === 4 && '😊 Very Good! Comfortable cruise.'}
              {overallRating === 3 && '😐 Average stay. Room for improvement.'}
              {overallRating === 2 && '🙁 Below expectations.'}
              {overallRating === 1 && '👎 Poor experience.'}
            </p>
          </div>

          {/* Sub-Category Ratings Grid */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Category Rating Breakdown
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              {[
                { label: 'Cleanliness & Hygiene', val: cleanlinessRating, set: setCleanlinessRating },
                { label: 'Hospitality & Crew', val: hospitalityRating, set: setHospitalityRating },
                { label: 'Food & Culinary Taste', val: foodRating, set: setFoodRating },
                { label: 'Cabin Comfort', val: comfortRating, set: setComfortRating },
                { label: 'Value for Money', val: valueForMoneyRating, set: setValueForMoneyRating },
              ].map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2 text-xs font-bold text-slate-700">
                  <span>{cat.label}</span>
                  <RatingStars
                    rating={cat.val}
                    size="sm"
                    interactive
                    onRatingChange={cat.set}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Title & Review Content */}
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                Review Headline *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Unforgettable Alleppey Backwater Experience!"
                maxLength={120}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-secondary-emerald/20 focus:border-secondary-emerald"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                Detailed Review *
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={4}
                placeholder="Share your experience about the crew, food quality, cruise route, cleanliness, and sunset views..."
                minLength={10}
                maxLength={3000}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-secondary-emerald/20 focus:border-secondary-emerald"
              />
            </div>

            {/* Pros & Cons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                  👍 Highlights (Pros)
                </label>
                <input
                  type="text"
                  value={pros}
                  onChange={(e) => setPros(e.target.value)}
                  placeholder="e.g. Delicious Karimeen fish, friendly captain"
                  className="w-full bg-emerald-50/50 border border-emerald-100 rounded-xl px-3 py-2 text-xs font-medium text-emerald-900 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-rose-800 uppercase tracking-wider block">
                  💡 Suggestions (Cons)
                </label>
                <input
                  type="text"
                  value={cons}
                  onChange={(e) => setCons(e.target.value)}
                  placeholder="e.g. AC cooling could be faster during afternoon"
                  className="w-full bg-rose-50/50 border border-rose-100 rounded-xl px-3 py-2 text-xs font-medium text-rose-900 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Photo Upload Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Upload Stay Photos ({images.length}/5)
              </label>
              <span className="text-[10px] text-slate-400">Optional</span>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              {images.map((url, idx) => (
                <div key={idx} className="relative w-16 h-16 rounded-2xl overflow-hidden border border-slate-200 group shadow-xs">
                  <img src={url} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute inset-0 bg-slate-900/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                  </button>
                </div>
              ))}

              {images.length < 5 && (
                <label className="w-16 h-16 rounded-2xl border-2 border-dashed border-slate-200 hover:border-secondary-emerald bg-slate-50 flex flex-col items-center justify-center cursor-pointer transition-colors text-slate-400 hover:text-secondary-emerald">
                  <Upload className="w-5 h-5" />
                  <span className="text-[9px] font-bold mt-1">Add Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Toggles: Recommend & Anonymous */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <label className="flex items-center gap-3 cursor-pointer text-xs font-bold text-slate-800">
              <input
                type="checkbox"
                checked={wouldRecommend}
                onChange={(e) => setWouldRecommend(e.target.checked)}
                className="w-4 h-4 rounded text-secondary-emerald focus:ring-secondary-emerald border-slate-300"
              />
              <span>I would recommend this houseboat to other travelers</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer text-xs font-bold text-slate-800">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
                className="w-4 h-4 rounded text-secondary-emerald focus:ring-secondary-emerald border-slate-300"
              />
              <span>Post review anonymously (hides my name and avatar)</span>
            </label>
          </div>

          {/* Submit Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="flex-1 py-3 bg-secondary-emerald hover:bg-secondary-emerald/90 text-white font-bold rounded-2xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> {existingReview ? 'Update Review' : 'Publish Review'}
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
