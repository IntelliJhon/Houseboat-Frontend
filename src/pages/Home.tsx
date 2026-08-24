import React from 'react';
import Hero from '../components/home/Hero';
import FeaturedHouseboats from '../components/home/FeaturedHouseboats';
import PopularDestinations from '../components/home/PopularDestinations';
import WhyChooseUs from '../components/home/WhyChooseUs';
import LuxuryExperience from '../components/home/LuxuryExperience';
import CustomerReviews from '../components/home/CustomerReviews';
import Faq from '../components/home/Faq';

const Home: React.FC = () => {
  return (
    <div className="flex flex-col w-full bg-[#fcfdfd]">
      {/* 1. Hero Banner and Search Panel */}
      <Hero />
      
      {/* 2. Featured Houseboats List */}
      <FeaturedHouseboats />
      
      {/* 3. Popular Backwater Destinations */}
      <PopularDestinations />

      {/* 4. Why Choose Us Features */}
      <WhyChooseUs />

      {/* 5. Full Width Call-to-Action Luxury Banner */}
      <LuxuryExperience />

      {/* 6. Customer Testimonials */}
      <CustomerReviews />

      {/* 7. FAQs Accordion */}
      <Faq />
    </div>
  );
};

export default Home;
