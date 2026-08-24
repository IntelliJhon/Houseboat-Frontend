import React from 'react';
import { ShieldCheck, Flame, Zap, Headphones } from 'lucide-react';

const features = [
  {
    icon: <ShieldCheck className="w-8 h-8 text-secondary-emerald" />,
    title: 'Verified Houseboats',
    desc: 'Every houseboat listed undergoes a strict physical quality audit covering safety, engine hygiene, and interior standards.',
  },
  {
    icon: <Flame className="w-8 h-8 text-secondary-emerald" />,
    title: 'Best Price Guarantee',
    desc: 'Direct partnership with local boat owners ensures no intermediate broker commissions, giving you the best rates online.',
  },
  {
    icon: <Zap className="w-8 h-8 text-secondary-emerald" />,
    title: 'Instant Booking',
    desc: 'Real-time boat availability engine. Lock your dates instantly and securely with zero booking request delays.',
  },
  {
    icon: <Headphones className="w-8 h-8 text-secondary-emerald" />,
    title: '24×7 Local Support',
    desc: 'Dedicated backwater concierges available at the docks and on-call to assist with check-in, special meals, and routes.',
  },
];

const WhyChooseUs: React.FC = () => {
  return (
    <section className="py-16 bg-white" id="why-choose">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
          <div className="inline-block bg-secondary-emerald/10 text-secondary-emerald text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Our Quality Shield
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-primary-deep">
            Why Choose b4boat
          </h2>
          <p className="text-slate-500 text-base">
            We bridge the gap between traditional Kerala tourism and modern booking convenience, promising trust at every milestone.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100 hover:bg-white hover:shadow-premium hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-slate-100 group-hover:bg-secondary-emerald/5 transition-colors mb-6">
                {feature.icon}
              </div>
              <h3 className="font-heading text-lg font-bold text-primary-deep mb-3">
                {feature.title}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default WhyChooseUs;
