import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, ChevronLeft, ChevronRight, Wifi, Shield, Compass } from 'lucide-react';

interface HouseboatCardProps {
  id: string;
  name: string;
  location: string;
  pricePerNight: number;
  rating: number;
  reviewsCount: number;
  images: string[];
  amenities: string[];
  category: string;
}

const HouseboatCard: React.FC<HouseboatCardProps> = ({
  id,
  name,
  location,
  pricePerNight,
  rating,
  reviewsCount,
  images,
  amenities,
  category,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 hover-lift flex flex-col h-full group">
      
      {/* 1. Image Slider Section */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={images[currentImageIndex]}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
        />
        
        {/* Soft image gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent" />

        {/* Category Badge */}
        <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-primary-deep text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm border border-white/50">
          {category}
        </span>

        {/* Navigation Arrows (Visible on card hover) */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white backdrop-blur-sm flex items-center justify-center shadow-md transition-opacity duration-300 opacity-0 group-hover:opacity-100 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-slate-700" />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white backdrop-blur-sm flex items-center justify-center shadow-md transition-opacity duration-300 opacity-0 group-hover:opacity-100 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 text-slate-700" />
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, idx) => (
              <span
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentImageIndex ? 'bg-white w-3' : 'bg-white/55'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* 2. Content Details Section */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div className="space-y-2">
          {/* Location & Rating */}
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-secondary-emerald" />
              {location.includes('Kerala') ? location : `${location} Backwaters, Kerala`}
            </span>
            <span className="flex items-center gap-1 text-slate-700">
              <Star className="w-3.5 h-3.5 fill-accent-gold text-accent-gold" />
              {rating.toFixed(1)} <span className="text-slate-400">({reviewsCount})</span>
            </span>
          </div>

          {/* Houseboat Title */}
          <h3 className="font-heading text-lg font-bold text-primary-deep group-hover:text-primary-light transition-colors line-clamp-1">
            {name}
          </h3>

          {/* Amenities Badges */}
          <div className="flex flex-wrap gap-2 pt-1.5">
            {amenities.slice(0, 3).map((amenity, idx) => (
              <span
                key={idx}
                className="text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1"
              >
                {amenity.toLowerCase().includes('wifi') && <Wifi className="w-2.5 h-2.5 text-slate-400" />}
                {amenity.toLowerCase().includes('safety') && <Shield className="w-2.5 h-2.5 text-slate-400" />}
                {amenity.toLowerCase().includes('deck') && <Compass className="w-2.5 h-2.5 text-slate-400" />}
                {amenity}
              </span>
            ))}
          </div>
        </div>

        {/* Pricing & Booking CTA */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-50">
          <div>
            <span className="text-xs text-slate-400 block">From</span>
            <span className="font-heading text-lg font-extrabold text-primary-deep">
              ₹{pricePerNight.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-slate-400">/night</span>
          </div>

          <div className="flex gap-2">
            <Link
              to={`/houseboat/${id}`}
              className="text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/80 px-3.5 py-2.5 rounded-xl transition-colors"
            >
              Details
            </Link>
            <Link
              to={`/houseboat/${id}`}
              className="text-xs font-bold bg-secondary-emerald hover:bg-secondary-emerald/90 text-white px-4 py-2.5 rounded-xl transition-all shadow-sm hover:scale-[1.02] cursor-pointer"
            >
              Book
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
};

export default HouseboatCard;
