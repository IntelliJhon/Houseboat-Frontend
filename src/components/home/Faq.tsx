import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: 'Are meals included in the houseboat booking price?',
    answer: 'Yes, standard bookings include freshly prepared traditional Kerala meals (Breakfast, Lunch, Evening Tea/Snacks, and Dinner) prepared onboard by your private chef. Special requests (such as specific seafood or vegetarian plans) can be aligned post-booking.',
  },
  {
    question: 'What is the typical check-in and check-out schedule?',
    answer: 'Standard check-in is at 12:00 PM, and check-out is at 9:00 AM the next morning. By government regulation, houseboats sail until 5:30 PM, anchor overnight to protect local fishing operations, and sail back to the boarding docks in the morning.',
  },
  {
    question: 'Are these houseboats safe for families and children?',
    answer: 'Yes, all houseboats verified by b4boat are equipped with life jackets (for both adults and children), fire extinguishers, and first-aid kits. The vessels are navigated exclusively by certified captains and experienced local crew members.',
  },
  {
    question: 'What is the cancellation policy?',
    answer: 'Standard bookings can be canceled for a full refund up to 7 days prior to check-in. Peak season bookings (Dec 15 - Jan 15) may follow stricter policies which will be highlighted on the details page before booking confirmation.',
  },
];

const Faq: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleAccordion = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="py-16 bg-white" id="faq">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-12 space-y-3">
          <div className="inline-block bg-secondary-emerald/10 text-secondary-emerald text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Clear Answers
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-primary-deep">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-500 text-base">
            Get answers to general concerns about boarding guidelines, safety parameters, and booking adjustments.
          </p>
        </div>

        {/* Accordions Wrapper */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="border border-slate-100 rounded-2xl overflow-hidden transition-all duration-300 bg-slate-50/50 hover:bg-white hover:border-slate-200"
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(idx)}
                  className="w-full flex items-center justify-between p-5 text-left font-bold text-primary-deep hover:text-primary-light transition-colors cursor-pointer text-sm sm:text-base"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${
                      isOpen ? 'transform rotate-180 text-primary-light' : ''
                    }`}
                  />
                </button>
                
                {/* Answer panel with expand animation */}
                <div
                  className={`transition-all duration-300 ease-in-out ${
                    isOpen ? 'max-h-48 border-t border-slate-100 p-5' : 'max-h-0 overflow-hidden'
                  }`}
                >
                  <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default Faq;
