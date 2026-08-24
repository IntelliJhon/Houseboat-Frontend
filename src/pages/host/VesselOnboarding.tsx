import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Camera, CheckSquare, DollarSign, Layers, 
  ShieldCheck, ArrowLeft, CheckCircle2, CloudUpload, Trash2, Loader2, Sparkles 
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const VesselOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

  // Stateful Form Data
  const [formData, setFormData] = useState({
    // Step 1: Specs
    name: '',
    description: '',
    location: 'Alleppey',
    category: 'Premium',
    bedrooms: 2,
    bathrooms: 1,
    capacity: 4,
    // Step 2: Certificates (Added per user request!)
    pollutionCertificateNo: '',
    pollutionExpiry: '',
    pollutionDocUrl: '',
    safetyAuditNo: '',
    safetyExpiry: '',
    safetyDocUrl: '',
    lifeJacketsCount: 6,
    // Step 3: Media
    coverImage: '',
    gallery1: '',
    gallery2: '',
    // Step 4: Amenities
    amenities: [] as string[],
    // Step 5: Pricing
    pricePerNight: 12000,
    cancellationPolicy: 'Moderate',
  });

  const [uploadedFiles, setUploadedFiles] = useState<{ id: string; name: string; size: string; preview: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingPollution, setIsUploadingPollution] = useState(false);
  const [isUploadingSafety, setIsUploadingSafety] = useState(false);

  const pollutionInputRef = useRef<HTMLInputElement>(null);
  const safetyInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handleFillDemoData = () => {
    setFormData({
      name: 'Vembanad Royal Palace Cruise',
      description: 'Experience supreme luxury across Kerala’s backwaters. Featuring glass-walled air-conditioned suites, handcrafted teak interiors, traditional Kerala gourmet dining, and an expansive upper deck sun lounge.',
      location: 'Vembanad',
      category: 'Ultra Luxury',
      bedrooms: 3,
      bathrooms: 3,
      capacity: 6,
      pollutionCertificateNo: 'PCB/KLT/2026/98241',
      pollutionExpiry: '2027-12-31',
      pollutionDocUrl: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=800&q=80',
      safetyAuditNo: 'KPORT/SAF/8842-B',
      safetyExpiry: '2027-10-15',
      safetyDocUrl: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=800&q=80',
      lifeJacketsCount: 12,
      coverImage: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1200&q=80',
      gallery1: '',
      gallery2: '',
      amenities: [
        'Air Conditioning', 'Free Breakfast', 'Private Chef Onboard',
        'Upper Deck Lounge', 'WiFi Access', 'Sun Deck Recliners',
        'Fishing Equipment', 'Bluetooth Sound System'
      ],
      pricePerNight: 18500,
      cancellationPolicy: 'Moderate',
    });

    setUploadedFiles([
      {
        id: 'demo-img-1',
        name: 'vembanad_houseboat_main.jpg',
        size: '1.4 MB',
        preview: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1200&q=80'
      },
      {
        id: 'demo-img-2',
        name: 'luxury_bedroom_suite.jpg',
        size: '1.1 MB',
        preview: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80'
      }
    ]);

    toast.success('⚡ Sample houseboat demo data auto-filled across all steps!');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'pollutionDocUrl' | 'safetyDocUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (fieldName === 'pollutionDocUrl') setIsUploadingPollution(true);
    else setIsUploadingSafety(true);

    const docName = fieldName === 'pollutionDocUrl' ? 'PCB Pollution Certificate' : 'Safety Audit Pass';
    const uploadToast = toast.loading(`Uploading ${docName} to Cloudinary...`);
    
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      
      const response = await api.post('/v1/host/upload', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const fileUrl = response.data.data.url;
      setFormData(prev => ({
        ...prev,
        [fieldName]: fileUrl
      }));
      
      toast.dismiss(uploadToast);
      toast.success(`${docName} uploaded successfully!`);
    } catch (err: any) {
      toast.dismiss(uploadToast);
      const errMsg = err.response?.data?.message || `Failed to upload ${docName} to Cloudinary.`;
      toast.error(errMsg);
    } finally {
      if (fieldName === 'pollutionDocUrl') setIsUploadingPollution(false);
      else setIsUploadingSafety(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (uploadedFiles.length >= 3) {
      toast.error('Maximum of 3 vessel photos allowed.');
      return;
    }

    setIsUploading(true);
    const uploadToast = toast.loading('Uploading vessel photo to Cloudinary...');
    
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      
      const response = await api.post('/v1/host/upload', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const fileUrl = response.data.data.url;
      const newFile = {
        id: `img-${Date.now()}`,
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        preview: fileUrl
      };
      
      setUploadedFiles(prev => [...prev, newFile]);
      setFormData(prev => ({
        ...prev,
        coverImage: fileUrl
      }));

      toast.dismiss(uploadToast);
      toast.success('Photo uploaded successfully!');
    } catch (err: any) {
      toast.dismiss(uploadToast);
      const errMsg = err.response?.data?.message || 'Failed to upload photo to Cloudinary.';
      toast.error(errMsg);
    } finally {
      setIsUploading(false);
    }
  };



  const handleDeletePhoto = (id: string) => {
    const updated = uploadedFiles.filter(f => f.id !== id);
    setUploadedFiles(updated);
    setFormData(prev => ({
      ...prev,
      coverImage: updated.length > 0 ? updated[0].preview : ''
    }));
    toast.success('Photo removed.');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData((prev) => {
      const isSelected = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: isSelected 
          ? prev.amenities.filter((a) => a !== amenity)
          : [...prev.amenities, amenity]
      };
    });
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !formData.name) {
      toast.error('Please enter the houseboat name.');
      return;
    }
    if (currentStep === 2 && (!formData.pollutionCertificateNo || !formData.safetyAuditNo)) {
      toast.error('Please fill in both Pollution Clearance and Safety Certificates.');
      return;
    }
    setCurrentStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.pollutionCertificateNo || !formData.safetyAuditNo) {
      toast.error('Please complete all compliance certifications before submitting.');
      return;
    }

    const loadingToast = toast.loading('Registering houseboat and audit clearances...');
    try {
      await api.post('/v1/host/houseboat', {
        name: formData.name,
        description: formData.description,
        location: formData.location,
        category: formData.category,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        capacity: formData.capacity,
        pollutionCertificateNo: formData.pollutionCertificateNo,
        pollutionExpiry: formData.pollutionExpiry,
        pollutionDocUrl: formData.pollutionDocUrl,
        safetyAuditNo: formData.safetyAuditNo,
        safetyExpiry: formData.safetyExpiry,
        safetyDocUrl: formData.safetyDocUrl,
        lifeJacketsCount: formData.lifeJacketsCount,
        coverImage: formData.coverImage,
        images: uploadedFiles.map(f => f.preview),
        amenities: formData.amenities,
        pricePerNight: formData.pricePerNight,
        cancellationPolicy: formData.cancellationPolicy,
      });

      toast.dismiss(loadingToast);
      toast.success('Vessel cleared & listed successfully! Welcome to b4boat Listings.', { duration: 4000 });
      
      // Redirect to host dashboard
      navigate('/host/dashboard');
    } catch (err: any) {
      toast.dismiss(loadingToast);
      let errMsg = 'Failed to list houseboat. Please verify compliance data.';
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors) && err.response.data.errors.length > 0) {
        errMsg = err.response.data.errors[0].message;
      } else if (err.response?.data?.message) {
        errMsg = err.response.data.message;
      }
      toast.error(errMsg);
    }
  };

  const stepsList = [
    { label: 'Specifications', icon: <Layers className="w-4 h-4" /> },
    { label: 'Certificates', icon: <ShieldCheck className="w-4 h-4" /> },
    { label: 'Media Gallery', icon: <Camera className="w-4 h-4" /> },
    { label: 'Amenities', icon: <CheckSquare className="w-4 h-4" /> },
    { label: 'Pricing & Policies', icon: <DollarSign className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div className="text-center sm:text-left space-y-1">
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-primary-deep">List Your Houseboat</h1>
          <p className="text-xs sm:text-sm text-slate-500">Register your vessel properties and safety compliance audits in five simple steps.</p>
        </div>

        <button
          type="button"
          onClick={handleFillDemoData}
          className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-secondary-emerald border border-emerald-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
        >
          <Sparkles className="w-4 h-4 text-emerald-500" />
          ⚡ Auto-Fill Sample Data
        </button>
      </div>

      {/* 2. Horizontal Wizard Tracker */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-premium p-5 flex items-center justify-between gap-4 overflow-x-auto">
        {stepsList.map((step, idx) => {
          const stepNum = idx + 1;
          const isCompleted = currentStep > stepNum;
          const isActive = currentStep === stepNum;
          
          return (
            <div key={idx} className="flex items-center gap-2 shrink-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  isCompleted 
                    ? 'bg-secondary-emerald text-white'
                    : isActive
                      ? 'bg-primary-deep text-white shadow-sm'
                      : 'bg-slate-100 text-slate-400'
                }`}
              >
                {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : stepNum}
              </div>
              <span className={`text-xs font-bold ${isActive ? 'text-primary-deep' : 'text-slate-400'}`}>
                {step.label}
              </span>
              {idx < stepsList.length - 1 && <span className="text-slate-200">/</span>}
            </div>
          );
        })}
      </div>

      {/* 3. Stateful Steps Panels */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-premium min-h-[300px] flex flex-col justify-between">
        
        <div className="space-y-6">
          
          {/* STEP 1: Specs */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <h3 className="font-heading text-lg font-bold text-primary-deep border-b border-slate-50 pb-2 mb-4">Vessel Specifications</h3>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Houseboat Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-300"
                  placeholder="E.g. Sapphire Lagoon Cruise"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">About Vessel *</label>
                <textarea
                  name="description"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-300 min-h-[80px]"
                  placeholder="Describe your houseboat stays, onboard hospitality, local voyage routes, etc."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Base Location</label>
                  <select
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-300 cursor-pointer"
                  >
                    <option value="Alleppey">Alleppey (Backwaters)</option>
                    <option value="Kumarakom">Kumarakom (Vembanad Lake)</option>
                    <option value="Kollam">Kollam (Backwater Gateway)</option>
                    <option value="Vembanad">Vembanad (Lake Voyage)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Boat Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-300 cursor-pointer"
                  >
                    <option value="Luxury">Luxury</option>
                    <option value="Premium">Premium</option>
                    <option value="Ultra Luxury">Ultra Luxury</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Bedrooms Count</label>
                  <input
                    type="number"
                    name="bedrooms"
                    min={1}
                    max={10}
                    value={formData.bedrooms}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Bathrooms Count</label>
                  <input
                    type="number"
                    name="bathrooms"
                    min={1}
                    max={10}
                    value={formData.bathrooms}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Max Guest Capacity</label>
                  <input
                    type="number"
                    name="capacity"
                    min={1}
                    max={30}
                    value={formData.capacity}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-300"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Compliance Certificates (Pollution & Safety) */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <h3 className="font-heading text-lg font-bold text-primary-deep border-b border-slate-50 pb-2 mb-4">Safety & Pollution Compliance</h3>
              
              {/* Pollution Clearance Section */}
              <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 space-y-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-secondary-emerald" /> Pollution Clearance Certificate
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Certificate Number *</label>
                    <input
                      type="text"
                      name="pollutionCertificateNo"
                      required
                      value={formData.pollutionCertificateNo}
                      onChange={handleInputChange}
                      placeholder="E.g. PCB-KLA-2026-928"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Expiry Date *</label>
                    <input
                      type="date"
                      name="pollutionExpiry"
                      required
                      value={formData.pollutionExpiry}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-300"
                    />
                  </div>
                </div>
                <input
                  type="file"
                  ref={pollutionInputRef}
                  onChange={(e) => handleFileUpload(e, 'pollutionDocUrl')}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <div 
                  onClick={() => pollutionInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 flex items-center justify-center gap-2 text-xs font-semibold bg-white hover:bg-slate-50 transition-all cursor-pointer ${
                    formData.pollutionDocUrl ? 'border-emerald-200 text-emerald-600 bg-emerald-50/10' : 'border-slate-200 text-slate-400'
                  }`}
                >
                  {isUploadingPollution ? (
                    <Loader2 className="w-4 h-4 animate-spin text-secondary-emerald" />
                  ) : (
                    <CloudUpload className="w-5 h-5" />
                  )}
                  {formData.pollutionDocUrl ? 'PCB Pollution Certificate Uploaded!' : 'Upload Signed PCB Document'}
                </div>
                {formData.pollutionDocUrl && (
                  <p className="text-[10px] text-emerald-600 font-bold text-center mt-1">
                    ✓ File stored: <a href={formData.pollutionDocUrl} target="_blank" rel="noreferrer" className="underline hover:text-emerald-700">View Document</a>
                  </p>
                )}
              </div>

              {/* Safety Compliance Section */}
              <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 space-y-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-secondary-emerald" /> Safety Compliance Audit Certificate
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Audit Clearance Number *</label>
                    <input
                      type="text"
                      name="safetyAuditNo"
                      required
                      value={formData.safetyAuditNo}
                      onChange={handleInputChange}
                      placeholder="E.g. PORT-SFTY-10294"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Audit Expiry Date *</label>
                    <input
                      type="date"
                      name="safetyExpiry"
                      required
                      value={formData.safetyExpiry}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-300"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Life Jackets Onboard *</label>
                    <input
                      type="number"
                      name="lifeJacketsCount"
                      min={4}
                      value={formData.lifeJacketsCount}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none"
                    />
                  </div>
                  <input
                    type="file"
                    ref={safetyInputRef}
                    onChange={(e) => handleFileUpload(e, 'safetyDocUrl')}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  <div 
                    onClick={() => safetyInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 flex items-center justify-center gap-2 text-xs font-semibold bg-white hover:bg-slate-50 transition-all cursor-pointer mt-5 ${
                      formData.safetyDocUrl ? 'border-emerald-200 text-emerald-600 bg-emerald-50/10' : 'border-slate-200 text-slate-400'
                    }`}
                  >
                    {isUploadingSafety ? (
                      <Loader2 className="w-4 h-4 animate-spin text-secondary-emerald" />
                    ) : (
                      <CloudUpload className="w-5 h-5" />
                    )}
                    {formData.safetyDocUrl ? 'Port Safety Pass Uploaded!' : 'Upload Port Safety Pass'}
                  </div>
                  {formData.safetyDocUrl && (
                    <p className="text-[10px] text-emerald-600 font-bold text-center mt-1">
                      ✓ File stored: <a href={formData.safetyDocUrl} target="_blank" rel="noreferrer" className="underline hover:text-emerald-700">View Document</a>
                    </p>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* STEP 3: Media Gallery */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <h3 className="font-heading text-lg font-bold text-primary-deep border-b border-slate-50 pb-2 mb-4">Vessel Media</h3>
              
              <input
                type="file"
                ref={photoInputRef}
                onChange={handlePhotoUpload}
                className="hidden"
                accept="image/*"
              />
              {/* Drag-and-drop file dropzone uploader */}
              <div 
                onClick={() => photoInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center flex flex-col items-center justify-center gap-3 bg-slate-50 hover:border-slate-300 hover:bg-slate-100/30 transition-all cursor-pointer"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-8 h-8 text-secondary-emerald animate-spin" />
                    <span className="text-xs font-semibold text-slate-500">Uploading houseboat photo...</span>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mx-auto">
                      <CloudUpload className="w-6 h-6 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-slate-700 block">Drag & drop files here or click to browse</span>
                      <span className="text-[10px] text-slate-400 font-semibold block">Supports JPG, PNG, WEBP (Max 5MB)</span>
                    </div>
                  </>
                )}
              </div>

              {/* Uploaded files list */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-3 pt-2 animate-in fade-in">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Uploaded Photos ({uploadedFiles.length})</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {uploadedFiles.map((file) => (
                      <div key={file.id} className="border border-slate-100 rounded-2xl p-3 bg-white shadow-sm flex items-center justify-between gap-3 group">
                        <div className="flex items-center gap-3 min-w-0">
                          <img src={file.preview} alt={file.name} className="w-12 h-12 rounded-xl object-cover border border-slate-100 shrink-0 shadow-sm" />
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-800 truncate block">{file.name}</span>
                            <span className="text-[10px] text-slate-400 font-semibold block">{file.size}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePhoto(file.id);
                          }}
                          className="p-1.5 rounded-xl hover:bg-red-50 text-red-500 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Amenities Checklist */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <h3 className="font-heading text-lg font-bold text-primary-deep border-b border-slate-50 pb-2 mb-4">Select Onboard Amenities</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {['Private Chef', 'Sun Deck', 'Wi-Fi', 'Safety Locker', 'Traditional Meals', 'AC in Bedrooms', 'Home Theatre', 'Fishing Gear'].map((amenity) => {
                  const checked = formData.amenities.includes(amenity);
                  return (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => handleAmenityToggle(amenity)}
                      className={`p-4 border rounded-2xl flex items-center justify-between text-xs font-bold cursor-pointer transition-all ${
                        checked
                          ? 'border-secondary-emerald bg-secondary-emerald/5 text-secondary-emerald'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span>{amenity}</span>
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        checked ? 'bg-secondary-emerald border-secondary-emerald text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {checked && <CheckCircle2 className="w-3.5 h-3.5 fill-current" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: Pricing & Rules */}
          {currentStep === 5 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <h3 className="font-heading text-lg font-bold text-primary-deep border-b border-slate-50 pb-2 mb-4">Pricing & Policies</h3>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Base Price per night *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">₹</span>
                  <input
                    type="number"
                    name="pricePerNight"
                    min={2000}
                    required
                    value={formData.pricePerNight}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-3.5 text-xs font-extrabold text-primary-deep focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Cancellation Policy</label>
                <select
                  name="cancellationPolicy"
                  value={formData.cancellationPolicy}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="Flexible">Flexible (Full refund 24 hrs before check-in)</option>
                  <option value="Moderate">Moderate (Full refund 5 days before check-in)</option>
                  <option value="Strict">Strict (Refund policies apply, no peak-season returns)</option>
                </select>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-xs text-slate-400 leading-relaxed">
                By submitting this form, you certify that the safety devices (life jackets, fire audit seals) are up to date and that the environmental compliance clearance is fully certified by the pollution control board authority.
              </div>
            </div>
          )}

        </div>

        {/* 4. Navigation controls */}
        <div className="border-t border-slate-50 pt-6 mt-8 flex items-center justify-between gap-4">
          <button
            type="button"
            disabled={currentStep === 1}
            onClick={handlePrevStep}
            className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="bg-primary-deep hover:bg-primary-light text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-sm hover:scale-[1.01] transition-all cursor-pointer"
            >
              Next Step
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSubmit}
              className="bg-secondary-emerald hover:bg-secondary-emerald/90 text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-sm hover:scale-[1.01] transition-all cursor-pointer"
            >
              Submit Listing Clearance
            </button>
          )}
        </div>

      </div>

    </div>
  );
};

export default VesselOnboarding;
