import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

import alleppeyImg from '../../assets/destinations/alleppey.jpg';
import kumarakomImg from '../../assets/destinations/kumarakom.jpg';
import kollamImg from '../../assets/destinations/kollam.jpg';
import ashtamudiImg from '../../assets/destinations/ashtamudi.jpg';
import vembanadImg from '../../assets/destinations/vembanad.jpg';

const destinationMetadata: Record<string, { desc: string; longDesc: string; image: string }> = {
  Alleppey: {
    desc: 'Venice of the East',
    longDesc: 'Explore endless labyrinths of canals, palms, and local villages.',
    image: alleppeyImg,
  },
  Kumarakom: {
    desc: 'Bird Sanctuary Haven',
    longDesc: 'Sail across Vembanad Lake and relax in premium luxury resorts.',
    image: kumarakomImg,
  },
  Kollam: {
    desc: 'Historic Backwater Gateway',
    longDesc: 'Uncover ancient trade paths and serene undisturbed channels.',
    image: kollamImg,
  },
  Ashtamudi: {
    desc: 'Eight-Coned Estuary',
    longDesc: 'Indulge in deep isolation and panoramic palm-lined lakeviews.',
    image: ashtamudiImg,
  },
  Vembanad: {
    desc: 'Vembanad Lake Voyage',
    longDesc: 'Cruise the expansive beauty of India’s longest scenic freshwater lake.',
    image: vembanadImg,
  }
};

import { listingsCache } from '../../services/listingsCache';

const destinationsList = [
  { name: 'Alleppey', ...destinationMetadata.Alleppey },
  { name: 'Kumarakom', ...destinationMetadata.Kumarakom },
  { name: 'Kollam', ...destinationMetadata.Kollam },
  { name: 'Vembanad', ...destinationMetadata.Vembanad },
];

const PopularDestinations: React.FC = () => {
  // Initialize destination counts instantly from memory/session cache
  const [vesselCounts, setVesselCounts] = useState<Record<string, number>>(() => {
    const cached = listingsCache.getInitialListings();
    return listingsCache.getDestinationCounts(cached);
  });

  useEffect(() => {
    // Perform fast background revalidation
    listingsCache.fetchListingsFresh((freshListings) => {
      setVesselCounts(listingsCache.getDestinationCounts(freshListings));
    });
  }, []);

  return (
    <section className="py-16 bg-slate-50" id="destinations">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-12 space-y-3">
          <div className="inline-block bg-secondary-emerald/10 text-secondary-emerald text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Explore Kerala
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-primary-deep">
            Popular Destinations
          </h2>
          <p className="text-slate-500 text-base">
            Escape to the most beautiful and iconic backwater channels in Kerala, each offering unique cultures and landscapes.
          </p>
        </div>

        {/* Grid Layout — 4 columns span 100% width evenly across desktop viewports */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {destinationsList.map((dest) => {
            const count = vesselCounts[dest.name] || 0;
            return (
              <Link
                key={dest.name}
                to={`/search?destination=${dest.name}`}
                className="relative rounded-3xl overflow-hidden aspect-[4/5] hover-lift group block shadow-premium border border-slate-100/50"
              >
                {/* Destination Image */}
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                />

                {/* Premium Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent transition-opacity duration-300 opacity-85 group-hover:opacity-90" />

                {/* Card Contents */}
                <div className="absolute inset-0 p-6 flex flex-col justify-end text-white z-10">
                  <div className="space-y-1.5 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-350 ease-out">
                    <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest block drop-shadow-xs">
                      {dest.desc}
                    </span>
                    <h3 className="font-heading text-xl sm:text-2xl font-extrabold text-white drop-shadow-md">
                      {dest.name}
                    </h3>
                    
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/25 backdrop-blur-md border border-emerald-400/40 text-emerald-300 font-extrabold text-[10px] uppercase tracking-wider shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {count} Houseboat{count !== 1 ? 's' : ''} listed
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 font-light opacity-0 group-hover:opacity-100 transition-opacity duration-300 line-clamp-2 mt-2 leading-relaxed">
                      {dest.longDesc}
                    </p>
                    
                    {/* Explore button visible on hover */}
                    <div className="pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/20 group-hover:bg-white group-hover:text-primary-deep transition-all shadow-sm">
                        <Compass className="w-3.5 h-3.5" /> Explore Stays
                      </span>
                    </div>
                  </div>
                </div>

              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default PopularDestinations;
