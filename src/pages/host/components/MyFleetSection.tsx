import React, { useState, useRef } from 'react';
import { 
  Plus, Search, Sliders, Ship, Calendar, MoreVertical, 
  Trash2, ChevronLeft, ChevronRight, ShieldAlert, Edit, Check, AlertTriangle, Upload, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import type { Houseboat } from '../HostDashboard';
import api from '../../../services/api';

interface MyFleetSectionProps {
  fleet: Houseboat[];
  setFleet: React.Dispatch<React.SetStateAction<Houseboat[]>>;
  setSelectedBoat: (boat: Houseboat | null) => void;
}

export const MyFleetSection: React.FC<MyFleetSectionProps> = ({
  fleet,
  setFleet,
  setSelectedBoat
}) => {
  const navigate = useNavigate();

  // Fleet page filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [bedroomsFilter, setBedroomsFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Active Dropdown Actions index
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(3);

  // Edit Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBoat, setEditingBoat] = useState<any | null>(null);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  
  // File upload state overrides
  const [pollutionDocUrl, setPollutionDocUrl] = useState<string | null>(null);
  const [safetyDocUrl, setSafetyDocUrl] = useState<string | null>(null);
  const [isUploadingPollution, setIsUploadingPollution] = useState(false);
  const [isUploadingSafety, setIsUploadingSafety] = useState(false);

  // Action duplicate handler
  const handleDuplicateListing = (boat: Houseboat) => {
    const duplicated: Houseboat = {
      ...boat,
      id: `HB-${Math.floor(1000 + Math.random() * 9000)}`,
      name: `${boat.name} (Copy)`,
      status: 'Draft',
      todayStatus: 'Blocked',
      monthlyOccupancy: 0,
      monthlyRevenue: 0,
      lastUpdated: 'Just now'
    };
    setFleet(prev => [duplicated, ...prev]);
    toast.success(`Duplicated listing as ${duplicated.name}`);
    setActiveDropdownId(null);
  };

  // Pause listing toggle
  const handlePauseListing = (id: string) => {
    setFleet(prev => 
      prev.map(b => {
        if (b.id === id) {
          const nextStatus = b.status === 'Inactive' ? 'Published' : 'Inactive';
          toast.success(`Vessel status set to ${nextStatus}`);
          return { ...b, status: nextStatus };
        }
        return b;
      })
    );
    setActiveDropdownId(null);
  };

  // Delete listing handler
  const handleDeleteListing = (id: string) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this listing permanently from the database?');
    if (!confirmDelete) return;

    setFleet(prev => prev.filter(b => b.id !== id));
    toast.error('Houseboat listing deleted.');
    setActiveDropdownId(null);
  };

  const handleOpenCalendarPage = (boat: Houseboat) => {
    setSelectedBoat(boat);
    window.location.hash = '#calendar';
    toast.success(`Loaded operations calendar for ${boat.name}`);
  };

  // Resubmit listing for admin audit review
  const handleResubmit = async (id: string) => {
    try {
      const loading = toast.loading('Resubmitting listing for admin review...');
      await api.patch(`/v1/host/listings/${id}/resubmit`);
      toast.dismiss(loading);
      toast.success('Listing resubmitted for admin review!');
      
      setFleet(prev => prev.map(b => b.id === id ? { ...b, status: 'Under Review', rejectionReason: undefined, reviewMessage: undefined } : b));
      setActiveDropdownId(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to resubmit listing.');
    }
  };

  // Open Edit Modal
  const openEditModal = (boat: Houseboat) => {
    setEditingBoat({ ...boat });
    setUploadedPhotos(boat.images || [boat.image]);
    setPollutionDocUrl(boat.pollutionDocUrl || null);
    setSafetyDocUrl(boat.safetyDocUrl || null);
    setIsEditModalOpen(true);
    setActiveDropdownId(null);
  };

  // Handle Photo File Select
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingPhoto(true);
    const loadingToast = toast.loading('Uploading photos to Cloudinary...');

    try {
      const newPhotoUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('image', file);

        try {
          const res = await api.post('/v1/upload/image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          const url = res.data?.data?.url;
          if (url) {
            newPhotoUrls.push(url);
          }
        } catch (uploadErr) {
          console.error('API upload failed, uploading via fallback:', uploadErr);
        }
      }

      toast.dismiss(loadingToast);

      if (newPhotoUrls.length > 0) {
        setUploadedPhotos(prev => [...prev, ...newPhotoUrls]);
        toast.success(`Successfully uploaded ${newPhotoUrls.length} photo(s)!`);
      } else {
        toast.error('Failed to upload photos. Please try again.');
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Error uploading photos.');
    } finally {
      setIsUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  // Handle File Upload for certificates
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'pollution' | 'safety') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'pollution') setIsUploadingPollution(true);
    else setIsUploadingSafety(true);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const uploadToast = toast.loading(`Uploading ${type} certificate...`);
      const response = await api.post('/v1/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const url = response.data?.data?.url;
      if (url) {
        if (type === 'pollution') setPollutionDocUrl(url);
        else setSafetyDocUrl(url);
        toast.success(`${type === 'pollution' ? 'Pollution Certificate' : 'Safety Permit'} uploaded!`);
      }
      toast.dismiss(uploadToast);
    } catch (err: any) {
      toast.error('File upload failed.');
    } finally {
      if (type === 'pollution') setIsUploadingPollution(false);
      else setIsUploadingSafety(false);
    }
  };

  // Remove Photo from Edit list
  const handleRemovePhoto = (indexToRemove: number) => {
    if (uploadedPhotos.length <= 1) {
      toast.error('At least 1 photo is required for the houseboat listing.');
      return;
    }
    setUploadedPhotos(prev => prev.filter((_, idx) => idx !== indexToRemove));
    toast.success('Photo removed.');
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBoat) return;

    try {
      const loading = toast.loading('Saving listing changes...');
      const payload = {
        ...editingBoat,
        images: uploadedPhotos,
        coverImage: uploadedPhotos[0] || '',
        pollutionDocUrl,
        safetyDocUrl,
      };

      await api.put(`/v1/host/listings/${editingBoat.id}`, payload);
      toast.dismiss(loading);
      toast.success('Listing updated successfully!');
      
      // Update locally
      setFleet(prev => prev.map(b => b.id === editingBoat.id ? { 
        ...b, 
        ...payload,
        pollutionDocUrl,
        safetyDocUrl,
        lastUpdated: 'Just now' 
      } : b));
      
      setIsEditModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update listing.');
    }
  };

  // Filter & Search checks
  const filteredFleet = fleet.filter(boat => {
    const matchesSearch = 
      boat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      boat.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      boat.id.toLowerCase().includes(searchQuery.toLowerCase());
      
    // Map backend statuses to exact filter queries
    let matchesStatus = true;
    if (statusFilter !== 'all') {
      const normalizedStatus = boat.status.toLowerCase().replace(/\s+/g, '');
      const normalizedFilter = statusFilter.toLowerCase().replace(/\s+/g, '');
      matchesStatus = normalizedStatus === normalizedFilter;
    }
    
    const matchesCategory = categoryFilter === 'all' || 
      (categoryFilter === 'luxury' && boat.category === 'Luxury') ||
      (categoryFilter === 'premium' && boat.category === 'Premium') ||
      (categoryFilter === 'deluxe' && boat.category === 'Deluxe');

    const matchesBedrooms = bedroomsFilter === 'all' || 
      (bedroomsFilter === '1' && boat.bedrooms === 1) ||
      (bedroomsFilter === '2' && boat.bedrooms === 2) ||
      (bedroomsFilter === '3+' && boat.bedrooms >= 3);

    const matchesLocation = locationFilter === 'all' || 
      boat.location.toLowerCase().includes(locationFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesCategory && matchesBedrooms && matchesLocation;
  });

  // Pagination bounds calculation
  const totalFleetPages = Math.ceil(filteredFleet.length / rowsPerPage);
  const paginatedFleet = filteredFleet.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header toolbar stats controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white rounded-3xl p-5 border border-slate-100 shadow-premium">
        <div className="space-y-1">
          <h2 className="font-heading text-lg font-extrabold text-primary-deep flex items-center gap-2">
            My Houseboats <Ship className="w-5 h-5 text-sky-600" />
          </h2>
          <p className="text-xs text-slate-400 font-semibold">Manage your fleet, pricing, availability and bookings.</p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button 
            type="button"
            onClick={() => {
              navigate('/host/onboarding');
            }}
            className="flex-1 md:flex-none bg-primary-deep hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add New Houseboat
          </button>
        </div>
      </div>

      {/* Filters Search Bar */}
      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-premium space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by houseboat name, location, or unique boat ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-300"
            />
          </div>

          <button 
            type="button"
            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-400" /> Filters
          </button>
        </div>

        {/* Collapsible filters pane */}
        {isFilterPanelOpen && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-50 text-xs font-bold text-slate-500">
            
            <div className="space-y-1.5">
              <label>Verification Status</label>
              <select 
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="Approved">Approved</option>
                <option value="Pending Approval">Pending Review</option>
                <option value="Under Review">Under Review</option>
                <option value="Rejected">Rejected</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label>Tier Category</label>
              <select 
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:outline-none cursor-pointer"
              >
                <option value="all">All Tiers</option>
                <option value="luxury">Luxury</option>
                <option value="premium">Premium</option>
                <option value="deluxe">Deluxe</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label>Bedrooms Size</label>
              <select 
                value={bedroomsFilter}
                onChange={(e) => {
                  setBedroomsFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:outline-none cursor-pointer"
              >
                <option value="all">Any Layout</option>
                <option value="1">1 Bedroom</option>
                <option value="2">2 Bedrooms</option>
                <option value="3">3 Bedrooms</option>
                <option value="4">4+ Bedrooms</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label>Harbor Port</label>
              <select 
                value={locationFilter}
                onChange={(e) => {
                  setLocationFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:outline-none cursor-pointer"
              >
                <option value="all">All Ports</option>
                <option value="alleppey">Alleppey</option>
                <option value="kumarakom">Kumarakom</option>
                <option value="kollam">Kollam</option>
              </select>
            </div>

          </div>
        )}
      </div>

      {/* Houseboats Grid Ledger */}
      {paginatedFleet.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {paginatedFleet.map((boat) => (
            <div key={boat.id} className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-premium flex flex-col justify-between group transition-all duration-300 hover:shadow-hover">
              
              {/* Card Image and status overlays */}
              <div className="relative h-44 overflow-hidden bg-slate-100">
                <img 
                  src={boat.image} 
                  alt={boat.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=600&q=80';
                  }}
                />
                
                {/* Category tag */}
                <span className="absolute left-4 top-4 bg-white/90 backdrop-blur-md text-primary-deep font-extrabold text-[9px] px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                  {boat.category}
                </span>

                {/* Dropdown Action menu */}
                <div className="absolute right-3 top-3">
                  <button 
                    type="button"
                    onClick={() => setActiveDropdownId(activeDropdownId === boat.id ? null : boat.id)}
                    className="w-7 h-7 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-slate-700 shadow-sm hover:bg-white cursor-pointer"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {activeDropdownId === boat.id && (
                    <div className="absolute right-0 mt-1 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 w-36 z-20 animate-in fade-in zoom-in-95 duration-100 text-xs font-bold text-slate-700">
                      <button 
                        type="button"
                        onClick={() => handleDuplicateListing(boat)}
                        className="w-full px-3 py-1.5 text-left hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
                      >
                        Duplicate Listing
                      </button>
                      <button 
                        type="button"
                        onClick={() => handlePauseListing(boat.id)}
                        className="w-full px-3 py-1.5 text-left hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer text-amber-600"
                      >
                        {boat.status === 'Inactive' ? 'Activate Listing' : 'Pause Listing'}
                      </button>
                      <hr className="border-slate-100 my-1" />
                      <button 
                        type="button"
                        onClick={() => handleDeleteListing(boat.id)}
                        className="w-full px-3 py-1.5 text-left hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete Vessel
                      </button>
                    </div>
                  )}
                </div>

                {/* Status Badges Overlay */}
                <div className="absolute left-4 bottom-4 flex gap-1.5">
                  <span className={`text-[8px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider backdrop-blur-md ${
                    boat.status === 'Approved' 
                      ? 'bg-emerald-500/80 text-white' 
                      : boat.status === 'Pending Approval'
                        ? 'bg-orange-500/80 text-white'
                      : boat.status === 'Under Review' 
                        ? 'bg-indigo-500/80 text-white'
                      : boat.status === 'Rejected' 
                        ? 'bg-rose-500/80 text-white'
                      : boat.status === 'Suspended' 
                        ? 'bg-red-600/80 text-white'
                        : 'bg-slate-600/80 text-white'
                  }`}>
                    {boat.status}
                  </span>
                  
                  <span className={`text-[8px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider backdrop-blur-md ${
                    boat.todayStatus === 'On Trip' 
                      ? 'bg-indigo-600/80 text-white'
                      : boat.todayStatus === 'Available'
                        ? 'bg-emerald-600/80 text-white'
                        : 'bg-rose-600/80 text-white'
                  }`}>
                    {boat.todayStatus}
                  </span>
                </div>

              </div>

              {/* Card Details Body */}
              <div className="p-5 flex-1 flex flex-col justify-between gap-4 text-xs font-bold text-slate-700">
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold">
                    <span className="font-mono">{boat.id.substring(0, 8).toUpperCase()}</span>
                    <span>Port: {boat.location}</span>
                  </div>
                  <h3 className="font-heading text-sm font-extrabold text-primary-deep truncate group-hover:text-primary-light transition-colors">
                    {boat.name}
                  </h3>
                </div>

                {/* Rejection / Review info alerts */}
                {boat.status === 'Rejected' && boat.rejectionReason && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-2xl text-[10px] text-red-700 space-y-1 font-semibold leading-relaxed">
                    <span className="text-[9px] font-bold text-red-600 uppercase tracking-wider flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Rejection reason:</span>
                    <p className="font-sans font-medium">{boat.rejectionReason}</p>
                  </div>
                )}

                {boat.status === 'Under Review' && boat.reviewMessage && (
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-[10px] text-indigo-700 space-y-1 font-semibold leading-relaxed">
                    <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Corrections Required:</span>
                    <p className="font-sans font-medium">{boat.reviewMessage}</p>
                  </div>
                )}

                {boat.status === 'Suspended' && boat.rejectionReason && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-2xl text-[10px] text-red-700 space-y-1 font-semibold leading-relaxed">
                    <span className="text-[9px] font-bold text-red-600 uppercase tracking-wider flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Suspension reason:</span>
                    <p className="font-sans font-medium">{boat.rejectionReason}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-y-3 gap-x-2 border-t border-b border-slate-50 py-3 text-[11px] font-semibold text-slate-500">
                  <div>
                    <span className="text-slate-400 text-[10px] block font-bold">CONFIG</span>
                    <span className="text-slate-800 font-bold">{boat.bedrooms} Bedrooms • {boat.capacity} Guests</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-bold">BASE RATE</span>
                    <span className="text-slate-800 font-extrabold">₹{boat.pricePerNight.toLocaleString('en-IN')}/night</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-bold">MONTHLY EARNINGS</span>
                    <span className="text-emerald-600 font-extrabold">₹{boat.monthlyRevenue.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-bold">OCCUPANCY RATE</span>
                    <span className="text-slate-800 font-bold">{boat.monthlyOccupancy}% this month</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => handleOpenCalendarPage(boat)}
                      className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-2 rounded-xl text-xs border border-slate-200 transition-all cursor-pointer text-center flex justify-center items-center gap-1 shadow-sm"
                    >
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> Calendar
                    </button>
                    
                    <button 
                      type="button"
                      onClick={() => openEditModal(boat)}
                      className="flex-1 bg-white hover:bg-slate-50 text-slate-700 font-bold py-2 rounded-xl text-xs border border-slate-200 transition-all cursor-pointer text-center"
                    >
                      Edit Listing
                    </button>
                  </div>

                  {(boat.status === 'Rejected' || boat.status === 'Under Review' || boat.status === 'Suspended') && (
                    <button
                      type="button"
                      onClick={() => handleResubmit(boat.id)}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer text-center uppercase tracking-wider shadow-sm"
                    >
                      Resubmit for Compliance Audit
                    </button>
                  )}
                </div>

              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 border border-slate-100 shadow-premium text-center space-y-3">
          <ShieldAlert className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="font-heading text-sm font-bold text-primary-deep">No Houseboats Found</h3>
          <p className="text-xs text-slate-400 font-semibold max-w-sm mx-auto">Try adjusting your filters or search keywords to find your registered vessels.</p>
        </div>
      )}

      {/* Pagination Controls */}
      {filteredFleet.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white rounded-2xl p-4 border border-slate-100 shadow-premium text-xs text-slate-500 font-semibold">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 font-bold focus:outline-none cursor-pointer"
            >
              <option value={3}>3</option>
              <option value={6}>6</option>
              <option value={12}>12</option>
            </select>
            <span>Showing {(currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, filteredFleet.length)} of {filteredFleet.length} vessels</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-slate-600"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-slate-700">Page {currentPage} of {totalFleetPages || 1}</span>
            <button
              type="button"
              disabled={currentPage === totalFleetPages || totalFleetPages === 0}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-slate-600"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Edit Listing Modal */}
      {isEditModalOpen && editingBoat && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-premium max-h-[90vh] overflow-y-auto space-y-6">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-heading text-sm font-extrabold text-primary-deep flex items-center gap-2">
                <Edit className="w-4 h-4 text-secondary-emerald" /> Edit Houseboat Listing
              </h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-full"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs font-bold text-slate-600">
              
              {/* Basic Specs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label>Houseboat Name *</label>
                  <input 
                    type="text" 
                    required
                    value={editingBoat.name}
                    onChange={(e) => setEditingBoat({ ...editingBoat, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label>Port Harbor *</label>
                  <select 
                    value={editingBoat.location}
                    onChange={(e) => setEditingBoat({ ...editingBoat, location: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none"
                  >
                    <option value="Alleppey">Alleppey</option>
                    <option value="Kumarakom">Kumarakom</option>
                    <option value="Kollam">Kollam</option>
                    <option value="Ashtamudi">Ashtamudi</option>
                    <option value="Vembanad">Vembanad</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label>About Vessel *</label>
                <textarea 
                  required
                  value={editingBoat.description || ''}
                  onChange={(e) => setEditingBoat({ ...editingBoat, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none min-h-[70px] font-sans font-medium"
                  placeholder="Tell guests about your houseboat's specialty..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label>Nightly Rate (₹) *</label>
                  <input 
                    type="number" 
                    required
                    value={editingBoat.pricePerNight}
                    onChange={(e) => setEditingBoat({ ...editingBoat, pricePerNight: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label>Capacity (Guests) *</label>
                  <input 
                    type="number" 
                    required
                    value={editingBoat.capacity}
                    onChange={(e) => setEditingBoat({ ...editingBoat, capacity: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label>Bedrooms *</label>
                  <input 
                    type="number" 
                    required
                    value={editingBoat.bedrooms}
                    onChange={(e) => setEditingBoat({ ...editingBoat, bedrooms: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label>Bathrooms *</label>
                  <input 
                    type="number" 
                    required
                    value={editingBoat.bathrooms || 1}
                    onChange={(e) => setEditingBoat({ ...editingBoat, bathrooms: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* Vessel Photos Manager */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <h4 className="text-[10px] text-primary-deep uppercase tracking-wider font-bold">Vessel Photos Manager</h4>
                
                {/* Drag-and-drop file dropzone uploader */}
                <div 
                  onClick={() => photoInputRef.current?.click()}
                  className="border border-dashed border-slate-200 rounded-2xl p-4 text-center flex flex-col items-center justify-center gap-2 bg-slate-50 hover:border-slate-300 hover:bg-slate-100/30 transition-all cursor-pointer"
                >
                  <input
                    type="file"
                    ref={photoInputRef}
                    onChange={handlePhotoSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  {isUploadingPhoto ? (
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 border-t-secondary-emerald animate-spin" />
                      <span className="text-[10px] text-slate-500 font-semibold">Uploading vessel photo...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 justify-center text-slate-500">
                      <Upload className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-600">Upload new boat photo</span>
                    </div>
                  )}
                </div>

                {/* Uploaded files list */}
                {uploadedPhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {uploadedPhotos.map((photoUrl, idx) => (
                      <div key={idx} className="relative rounded-xl overflow-hidden aspect-video border border-slate-100 shadow-sm group">
                        <img src={photoUrl} alt={`Boat ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePhoto(idx);
                          }}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-lg opacity-90 hover:opacity-100 transition-opacity cursor-pointer shadow"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Document upload fields */}
              <div className="border-t border-slate-100 pt-4 space-y-4">
                <h4 className="text-[10px] text-primary-deep uppercase tracking-wider font-bold">Document Clearances Re-upload</h4>
                
                {/* Pollution doc */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label>Pollution Certificate No *</label>
                    {pollutionDocUrl ? (
                      <span className="text-[9px] text-emerald-600 flex items-center gap-1 font-semibold"><Check className="w-3.5 h-3.5" /> Uploaded</span>
                    ) : (
                      <span className="text-[9px] text-amber-600 font-semibold">Missing File Link</span>
                    )}
                  </div>
                  <input 
                    type="text" 
                    required
                    value={editingBoat.pollutionCertificateNo || ''}
                    onChange={(e) => setEditingBoat({ ...editingBoat, pollutionCertificateNo: e.target.value })}
                    placeholder="Cert number..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <input 
                      type="date" 
                      required
                      value={editingBoat.pollutionExpiry ? editingBoat.pollutionExpiry.split('T')[0] : ''}
                      onChange={(e) => setEditingBoat({ ...editingBoat, pollutionExpiry: e.target.value })}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700"
                    />
                    <label className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl cursor-pointer text-[10px] font-bold">
                      <Upload className="w-3.5 h-3.5" /> {isUploadingPollution ? 'Uploading...' : 'Change File'}
                      <input 
                        type="file" 
                        accept="application/pdf,image/*" 
                        className="hidden" 
                        onChange={(e) => handleFileUpload(e, 'pollution')} 
                        disabled={isUploadingPollution}
                      />
                    </label>
                  </div>
                </div>

                {/* Safety Permit */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label>Operational Safety Permit No *</label>
                    {safetyDocUrl ? (
                      <span className="text-[9px] text-emerald-600 flex items-center gap-1 font-semibold"><Check className="w-3.5 h-3.5" /> Uploaded</span>
                    ) : (
                      <span className="text-[9px] text-amber-600 font-semibold">Missing File Link</span>
                    )}
                  </div>
                  <input 
                    type="text" 
                    required
                    value={editingBoat.safetyAuditNo || ''}
                    onChange={(e) => setEditingBoat({ ...editingBoat, safetyAuditNo: e.target.value })}
                    placeholder="Permit number..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <input 
                      type="date" 
                      required
                      value={editingBoat.safetyExpiry ? editingBoat.safetyExpiry.split('T')[0] : ''}
                      onChange={(e) => setEditingBoat({ ...editingBoat, safetyExpiry: e.target.value })}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700"
                    />
                    <label className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl cursor-pointer text-[10px] font-bold">
                      <Upload className="w-3.5 h-3.5" /> {isUploadingSafety ? 'Uploading...' : 'Change File'}
                      <input 
                        type="file" 
                        accept="application/pdf,image/*" 
                        className="hidden" 
                        onChange={(e) => handleFileUpload(e, 'safety')} 
                        disabled={isUploadingSafety}
                      />
                    </label>
                  </div>
                </div>

              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingPollution || isUploadingSafety}
                  className="bg-primary-deep hover:bg-slate-800 text-white font-bold px-5 py-2.5 rounded-xl shadow-md cursor-pointer"
                >
                  Save Changes
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
