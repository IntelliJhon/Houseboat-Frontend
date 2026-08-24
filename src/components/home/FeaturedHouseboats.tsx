import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import HouseboatCard from '../common/HouseboatCard';
import houseboatImg from '../../assets/houseboat-float.png';
import api from '../../services/api';

const FeaturedHouseboats: React.FC = () => {
  const navigate = useNavigate();
  const [vessels, setVessels] = useState<any[]>([]);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const response = await api.get('/v1/listings');
        const dbVessels = response.data?.data?.listings || [];
        const mapped = dbVessels.slice(0, 3).map((dbBoat: any) => ({
          id: dbBoat.id,
          name: dbBoat.name,
          location: dbBoat.location,
          pricePerNight: dbBoat.pricePerNight,
          rating: 4.85,
          reviewsCount: 18,
          category: dbBoat.category || 'Premium',
          images: dbBoat.images?.length > 0 ? dbBoat.images : ['https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=600&q=80'],
          amenities: dbBoat.amenities || [],
        }));
        setVessels(mapped);
      } catch (err) {
        console.error('Failed to load featured houseboats:', err);
      }
    };
    fetchFeatured();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const viewHeight = window.innerHeight;

      // Calculate progress relative to the entire visibility duration of the section
      if (rect.top < viewHeight && rect.bottom > 0) {
        const totalDistance = viewHeight + rect.height;
        const currentDistance = viewHeight - rect.top;
        const progress = currentDistance / totalDistance; // 0 to 1
        setScrollProgress(progress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initialize on mount
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavigateToListings = () => {
    navigate('/search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section ref={sectionRef} className="py-20 bg-white relative overflow-hidden" id="featured">
      
      {/* 1. Animated Floating Houseboat Background (Full Opacity & Color Accuracy) */}
      <div 
        className="absolute -bottom-6 md:-bottom-10 left-0 w-[280px] md:w-[420px] h-28 md:h-36 pointer-events-none select-none z-0 opacity-100"
        style={{
          transform: `translateX(${85 - scrollProgress * 135}vw) translateY(${Math.sin(scrollProgress * Math.PI * 6) * 8}px)`,
          transition: 'transform 0.1s ease-out',
        }}
      >
        <img 
          src={houseboatImg} 
          alt="Sailing Kerala Houseboat" 
          className="h-full object-contain"
          style={{ transform: 'scaleX(-1)' }} // Faces left
        />
      </div>

      {/* 2. Soft Wave overlay behind the boat */}
      <div className="absolute bottom-0 left-0 w-full h-12 pointer-events-none select-none z-0 opacity-50">
        <svg className="w-full h-full text-slate-50 fill-current" preserveAspectRatio="none" viewBox="0 0 1440 74">
          <path d="M0,32L120,42.7C240,53,480,75,720,74.7C960,75,1200,53,1320,42.7L1440,32L1440,74L1320,74C1200,74,960,74,720,74C480,74,240,74,120,74L0,74Z" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center md:text-left md:flex md:items-end md:justify-between mb-12">
          <div className="space-y-3">
            <div className="inline-block bg-secondary-emerald/10 text-secondary-emerald text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Handpicked Stays
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-primary-deep">
              Featured Luxury Houseboats
            </h2>
            <p className="text-slate-500 max-w-xl text-base">
              Sail into pure bliss with our highest rated houseboat experiences, offering modern conveniences wrapped in heritage designs.
            </p>
          </div>
          
          <button 
            type="button"
            onClick={handleNavigateToListings}
            className="hidden md:block text-sm font-bold text-primary-light hover:text-primary-deep transition-colors mt-4 md:mt-0 cursor-pointer"
          >
            View All Houseboats →
          </button>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {vessels.map((hb) => (
            <div key={hb.id} className="animate-in fade-in duration-500">
              <HouseboatCard {...hb} />
            </div>
          ))}
        </div>

        {/* Mobile View All CTA */}
        <div className="text-center mt-8 md:hidden">
          <button 
            type="button"
            onClick={handleNavigateToListings}
            className="text-sm font-bold text-primary-light hover:text-primary-deep transition-colors cursor-pointer"
          >
            View All Houseboats →
          </button>
        </div>

      </div>
    </section>
  );
};

export default FeaturedHouseboats;
