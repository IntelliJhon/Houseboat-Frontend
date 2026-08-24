import React from 'react';

const LuxuryExperience: React.FC = () => {
  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden my-8">
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <video
          src="/boat.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover object-center"
        />
        {/* Rich dark overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-deep/90 via-primary-deep/70 to-transparent" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto flex flex-col items-center text-center space-y-6 text-white">
        <div className="inline-block bg-accent-gold/20 text-accent-gold text-[10px] font-bold px-3.5 py-1.5 rounded-full uppercase tracking-widest border border-accent-gold/25">
          Bespoke Journeys
        </div>
        <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight">
          Elevate Your Vacation To <br />
          <span className="text-accent-gold">Floating Palaces</span>
        </h2>
        <p className="text-slate-300 text-base sm:text-lg max-w-2xl font-light leading-relaxed">
          From customized local cuisines prepared by your private chef to route planning across undisturbed lagoons, tailor-make your houseboat experience today.
        </p>
      </div>
    </section>
  );
};

export default LuxuryExperience;
