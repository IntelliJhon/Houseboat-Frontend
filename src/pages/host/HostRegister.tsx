import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Ship, TrendingUp, ArrowRight, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const HostRegister: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
    panNumber: '',
    licenseNumber: '',
    portAuthority: 'Alleppey',
  });

  // Pre-fill fields from AuthContext on mount
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
      }));
    }
  }, [user]);

  // Fetch existing host profile details if available
  useEffect(() => {
    const fetchExistingProfile = async () => {
      try {
        const response = await api.get('/v1/host/profile');
        if (response.data.data.profile) {
          const profile = response.data.data.profile;
          setFormData((prev) => ({
            ...prev,
            companyName: profile.companyName || '',
            panNumber: profile.panNumber || '',
            licenseNumber: profile.licenseNumber || '',
            portAuthority: profile.portAuthority || 'Alleppey',
          }));
        }
      } catch (err) {
        console.log('No existing host profile details found.');
      }
    };
    fetchExistingProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.panNumber || !formData.licenseNumber || !formData.portAuthority) {
      toast.error('Please fill in PAN card, Tourism License, and Port Jurisdiction.');
      return;
    }

    const toastId = toast.loading('Registering host profile & licensing credentials...');
    try {
      await api.post('/v1/host/profile', {
        companyName: formData.companyName,
        panNumber: formData.panNumber,
        licenseNumber: formData.licenseNumber,
        portAuthority: formData.portAuthority,
      });

      toast.dismiss(toastId);
      toast.success('Host profile registered! Welcome aboard, captain.', { duration: 4000 });
      
      // Redirect to vessel listing registration onboarding wizard
      navigate('/host/onboarding');
    } catch (err: any) {
      toast.dismiss(toastId);
      let errMsg = 'Failed to register host profile. Please try again.';
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors) && err.response.data.errors.length > 0) {
        errMsg = err.response.data.errors[0].message;
      } else if (err.response?.data?.message) {
        errMsg = err.response.data.message;
      }
      toast.error(errMsg);
    }
  };

  const benefits = [
    {
      icon: <TrendingUp className="w-6 h-6 text-secondary-emerald" />,
      title: 'Maximize Your Earnings',
      desc: 'Connect directly with premium travelers. Save up to 15% on local broker fees and commissions.',
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-secondary-emerald" />,
      title: 'Verified Trusted Portal',
      desc: 'Secure digital payouts and instant bank transfers directly aligned with boarding completions.',
    },
    {
      icon: <Ship className="w-6 h-6 text-secondary-emerald" />,
      title: 'Local Port Concierges',
      desc: 'Dedicated assistance at Punnamada and Kumarakom docks to support boarding check-ins.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left Column: Onboarding info & benefits */}
        <div className="lg:col-span-5 space-y-8">
          <div className="space-y-3">
            <span className="inline-block bg-secondary-emerald/10 text-secondary-emerald text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              b4boat Captaincy
            </span>
            <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-primary-deep leading-tight">
              List Your Houseboat <br />
              & Expand Your Business
            </h1>
            <p className="text-slate-500 text-sm leading-relaxed">
              Join Kerala's leading luxury houseboat network. Manage reservations, accept payments securely, and welcome guests from around the globe.
            </p>
          </div>

          <div className="space-y-6">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="flex gap-4 items-start">
                <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm shrink-0">
                  {benefit.icon}
                </div>
                <div>
                  <h4 className="font-heading text-sm font-bold text-primary-deep">{benefit.title}</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-xs text-slate-400 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-secondary-emerald shrink-0" />
            <span>Government registry verification completes within 24 hours of document review.</span>
          </div>
        </div>

        {/* Right Column: Register Form */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-premium">
          <div className="border-b border-slate-50 pb-4 mb-6">
            <h3 className="font-heading text-lg font-bold text-primary-deep">Host Onboarding Application</h3>
            <p className="text-xs text-slate-400">Fill in owner details and licensing records to proceed.</p>
          </div>

          <form onSubmit={handleRegisterSubmit} className="space-y-5">
            
            {/* Owner Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-300"
                  placeholder="E.g. Joseph"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-300"
                  placeholder="E.g. Kurian"
                />
              </div>
            </div>

            {/* Contact details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-300"
                  placeholder="joseph@example.com"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-300"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            {/* Business Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Company Name (Optional)</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-300"
                  placeholder="E.g. Alleppey Cruises Group"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Business PAN Card *</label>
                <input
                  type="text"
                  name="panNumber"
                  required
                  value={formData.panNumber}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-300"
                  placeholder="E.g. ABCDE1234F"
                />
              </div>
            </div>

            {/* Compliance Licensing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Govt Tourism License Number *</label>
                <input
                  type="text"
                  name="licenseNumber"
                  required
                  value={formData.licenseNumber}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-300"
                  placeholder="E.g. KLT-HB-9824"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Port Authority Jurisdiction</label>
                <select
                  name="portAuthority"
                  value={formData.portAuthority}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-300 cursor-pointer"
                >
                  <option value="Alleppey">Alleppey (Punnamada)</option>
                  <option value="Kumarakom">Kumarakom (Kottayam)</option>
                  <option value="Kollam">Kollam (Quilon)</option>
                  <option value="Vembanad">Vembanad (Lake Voyage)</option>
                </select>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-4 bg-secondary-emerald hover:bg-secondary-emerald/90 text-white font-bold rounded-2xl text-xs uppercase tracking-wider shadow-md hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-2 mt-4"
            >
              Continue to Boat Registry <ArrowRight className="w-4 h-4" />
            </button>

          </form>
        </div>

      </div>
    </div>
  );
};

export default HostRegister;
