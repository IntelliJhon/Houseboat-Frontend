import React from 'react';
import SearchBar from '../search/SearchBar';

const Hero: React.FC = () => {
  return (
    <section className="relative z-20 min-h-[85vh] lg:min-h-[90vh] flex items-center justify-center -mt-24 px-4 sm:px-6 lg:px-8">
      {/* Background Image Container */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1920&q=80"
          alt="Kerala Houseboat Backwaters"
          className="w-full h-full object-cover object-center scale-105 animate-in fade-in duration-700"
        />
        {/* Soft dark-gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-deep/75 via-primary-deep/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#fcfdfd] via-transparent to-transparent" />
      </div>

      {/* Hero Content Area */}
      <div className="relative z-10 max-w-5xl w-full text-center lg:text-left pt-28 pb-12 sm:py-16 lg:py-24 flex flex-col gap-6 sm:gap-8">
        
        {/* Decorative Badge */}
        <div className="inline-flex self-center lg:self-start items-center gap-2 bg-white/15 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/25 text-white font-semibold text-xs tracking-wider uppercase shadow-sm">
          <span className="w-2 h-2 rounded-full bg-accent-gold animate-ping" />
          Luxury Backwater Voyages
        </div>

        {/* Headlines */}
        <div className="space-y-4">
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
            Experience Kerala's <br className="hidden lg:block" />
            <span className="text-accent-gold">Finest Houseboats</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-200 max-w-2xl font-light">
            Sail through serene emerald backwaters, witness golden hour sunsets, and enjoy premium hospitality in the heart of God's Own Country.
          </p>
        </div>

        {/* Nested Search Panel */}
        <div className="mt-4 w-full max-w-4xl animate-in slide-in-from-bottom-5 duration-500">
          <SearchBar />
        </div>

      </div>
    </section>
  );
};

export default Hero;
