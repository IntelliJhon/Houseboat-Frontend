import React, { useState, useEffect } from 'react';
import { 
  Search, ShieldCheck, X, MapPin, FileText, Eye, User, Shield, Compass, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../services/api';

export const VerifyVesselsSection: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [vessels, setVessels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Drawer state
  const [selectedVessel, setSelectedVessel] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Request More Info states
  const [isRequestingInfo, setIsRequestingInfo] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');

  // Suspend states
  const [isSuspending, setIsSuspending] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');

  // Active quick preview tab index for each vessel card
  const [quickPreviewTabs, setQuickPreviewTabs] = useState<{ [boatId: string]: 'gallery' | 'amenities' | 'pricing' | 'certificates' }>({});

  const fetchVessels = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/v1/admin/vessels/pending');
      const dbVessels = response.data?.data?.vessels || [];
      
      const mapped = dbVessels.map((dbBoat: any) => {
        // Map status string
        let displayStatus = 'Pending';
        if (dbBoat.status === 'APPROVED') displayStatus = 'Approved';
        if (dbBoat.status === 'REJECTED') displayStatus = 'Rejected';
        if (dbBoat.status === 'UNDER_REVIEW') displayStatus = 'Under Review';
        if (dbBoat.status === 'SUSPENDED') displayStatus = 'Suspended';

        return {
          id: dbBoat.id,
          name: dbBoat.name,
          ownerName: dbBoat.host?.name || 'Unknown Partner',
          ownerPhone: dbBoat.host?.phone || 'N/A',
          ownerEmail: dbBoat.host?.email || 'N/A',
          location: dbBoat.location,
          category: dbBoat.category || 'Premium',
          bedrooms: dbBoat.bedrooms,
          capacity: dbBoat.capacity,
          regDate: new Date(dbBoat.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
          status: displayStatus,
          docCompletion: (dbBoat.pollutionDocUrl && dbBoat.safetyDocUrl) ? 100 : 50,
          pricePerNight: dbBoat.pricePerNight,
          image: dbBoat.images?.[0] || 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=600&q=80',
          amenities: dbBoat.amenities || [],
          gallery: dbBoat.images || [],
          certificates: {
            insurance: { name: 'Vessel Hull & P&I Insurance Policy', no: 'INS-DB-MOCK', status: 'Pending Review', expiry: 'Jan 15, 2027' },
            pollution: { name: 'Clean Waters Pollution Certificate', no: dbBoat.pollutionCertificateNo || 'N/A', status: dbBoat.pollutionDocUrl ? 'Verified' : 'Missing Doc', expiry: dbBoat.pollutionExpiry ? new Date(dbBoat.pollutionExpiry).toLocaleDateString() : 'N/A', url: dbBoat.pollutionDocUrl },
            safety: { name: 'Port Authority Operational Safety Permit', no: dbBoat.safetyAuditNo || 'N/A', status: dbBoat.safetyDocUrl ? 'Verified' : 'Missing Doc', expiry: dbBoat.safetyExpiry ? new Date(dbBoat.safetyExpiry).toLocaleDateString() : 'N/A', url: dbBoat.safetyDocUrl },
            license: { name: 'Vessel Commercial Operations License', no: dbBoat.host?.hostProfile?.licenseNumber || 'N/A', status: 'Verified', expiry: 'N/A' }
          },
          timeline: [
            { title: 'Application Submitted', date: new Date(dbBoat.createdAt).toLocaleDateString(), desc: 'Listing initial parameters submitted by partner.' },
            dbBoat.reviewedAt ? { title: 'Compliance Audited', date: new Date(dbBoat.reviewedAt).toLocaleDateString(), desc: `Last audit reviewed at: ${new Date(dbBoat.reviewedAt).toLocaleTimeString()}` } : null
          ].filter(Boolean)
        };
      });

      setVessels(mapped);
    } catch (err: any) {
      console.error('Failed to load pending vessels:', err);
      toast.error('Could not fetch vessel listings ledger.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVessels();
  }, []);

  const [vesselToApprove, setVesselToApprove] = useState<string | null>(null);

  const handleApprove = (id: string) => {
    setVesselToApprove(id);
  };

  const proceedApproval = async (id: string) => {
    try {
      const loading = toast.loading('Authorizing listing approval...');
      await api.patch(`/v1/admin/vessels/${id}/approve`);
      toast.dismiss(loading);
      toast.success('Listing approved and published successfully!');
      setIsDrawerOpen(false);
      fetchVessels();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Approval failed.');
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      toast.error('Please specify a rejection reason.');
      return;
    }

    try {
      const loading = toast.loading('Submitting rejection status...');
      await api.patch(`/v1/admin/vessels/${selectedVessel.id}/reject`, { reason: rejectionReason });
      toast.dismiss(loading);
      toast.error('Listing registration rejected.');
      setIsDrawerOpen(false);
      setIsRejecting(false);
      setRejectionReason('');
      fetchVessels();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Rejection failed.');
    }
  };

  const handleRequestInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestMessage.trim()) {
      toast.error('Please specify what information the partner needs to upload.');
      return;
    }

    try {
      const loading = toast.loading('Sending information request...');
      await api.patch(`/v1/admin/vessels/${selectedVessel.id}/request-info`, { message: requestMessage });
      toast.dismiss(loading);
      toast.success('Information request dispatched to partner.');
      setIsDrawerOpen(false);
      setIsRequestingInfo(false);
      setRequestMessage('');
      fetchVessels();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Information request failed.');
    }
  };

  const handleSuspend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspendReason.trim()) {
      toast.error('Please specify a suspension reason.');
      return;
    }

    try {
      const loading = toast.loading('Suspending active listing...');
      await api.patch(`/v1/admin/vessels/${selectedVessel.id}/suspend`, { reason: suspendReason });
      toast.dismiss(loading);
      toast.error('Listing suspended and un-published.');
      setIsDrawerOpen(false);
      setIsSuspending(false);
      setSuspendReason('');
      fetchVessels();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Suspension failed.');
    }
  };

  const filteredVessels = vessels.filter(boat => {
    const matchesSearch = boat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      boat.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      boat.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      boat.location.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === 'all' || 
      boat.status.toLowerCase() === statusFilter.toLowerCase() ||
      (statusFilter === 'incomplete' && boat.docCompletion < 100);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-extrabold text-primary-deep flex items-center gap-2">
            Verify Houseboats <ShieldCheck className="w-5 h-5 text-accent-gold" />
          </h1>
          <p className="text-xs text-slate-400 font-semibold font-sans">Review, verify and approve newly submitted houseboats before public launch.</p>
        </div>
      </div>

      {/* Top Cards Statistics row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Pending Verification', val: vessels.filter(v => v.status === 'Pending').length, color: 'bg-amber-50 text-amber-600 border-amber-100' },
          { label: 'Under Review', val: vessels.filter(v => v.status === 'Under Review').length, color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
          { label: 'Rejected Listings', val: vessels.filter(v => v.status === 'Rejected').length, color: 'bg-rose-50 text-rose-600 border-rose-100' },
          { label: 'Suspended Vessels', val: vessels.filter(v => v.status === 'Suspended').length, color: 'bg-red-50 text-red-600 border-red-100' },
          { label: 'Compliance Score', val: '98.4%', color: 'bg-slate-100 text-slate-600 border-slate-200' }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-premium flex flex-col justify-between gap-3 text-center">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">{stat.label}</span>
            <span className={`text-sm font-extrabold px-3 py-1 rounded-xl border inline-block mx-auto ${stat.color}`}>{stat.val}</span>
          </div>
        ))}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-3xl border border-slate-100 p-4 shadow-premium space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by houseboat name, owner, boat ID, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-300"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Verification Statuses</option>
              <option value="pending">Pending</option>
              <option value="under review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="suspended">Suspended</option>
              <option value="incomplete">Incomplete Documents</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading state indicator */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400 font-bold text-xs">
          Loading pending compliance logs from PostgreSQL...
        </div>
      ) : (
        /* Verification Ledger Cards Grid */
        <div className="grid grid-cols-1 gap-8">
          {filteredVessels.length > 0 ? (
            filteredVessels.map((boat) => {
              const activeTab = quickPreviewTabs[boat.id] || 'certificates';
              return (
                <div key={boat.id} className="bg-white rounded-3xl border border-slate-100 shadow-premium overflow-hidden grid grid-cols-1 lg:grid-cols-12 hover-lift transition-all">
                  
                  {/* Image Section */}
                  <div className="lg:col-span-4 relative aspect-[16/9] lg:aspect-auto bg-slate-100 min-h-[220px]">
                    <img src={boat.image} alt={boat.name} className="w-full h-full object-cover" />
                    <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-primary-deep text-[9px] font-bold px-2.5 py-1 rounded-full uppercase shadow-sm border border-white/50">
                      {boat.category}
                    </span>
                    
                    <span className={`absolute top-4 right-4 text-[9px] font-bold px-3 py-1 rounded-full uppercase shadow-sm border ${
                      boat.status === 'Approved' ? 'bg-emerald-500 text-white border-emerald-400' :
                      boat.status === 'Rejected' ? 'bg-rose-500 text-white border-rose-400' :
                      boat.status === 'Under Review' ? 'bg-indigo-500 text-white border-indigo-400' :
                      boat.status === 'Suspended' ? 'bg-red-500 text-white border-red-400' :
                      'bg-amber-500 text-white border-amber-400'
                    }`}>
                      {boat.status}
                    </span>

                    <div className="absolute bottom-4 left-4 bg-slate-900/60 backdrop-blur-sm text-white rounded-xl p-2 border border-white/10 text-[10px] font-semibold flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-accent-gold" />
                      <span>Docs Uploaded: {boat.docCompletion}%</span>
                    </div>
                  </div>

                  {/* Details Section */}
                  <div className="lg:col-span-8 p-6 flex flex-col justify-between gap-6">
                    <div className="space-y-4">
                      {/* Header line details */}
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <div className="flex gap-2 items-center">
                            <span className="font-mono text-slate-400 text-[10px]">{boat.id.substring(0, 8).toUpperCase()}</span>
                            <span className="text-[10px] text-slate-400">• Registered: {boat.regDate}</span>
                          </div>
                          <h3 className="font-heading text-lg font-extrabold text-primary-deep">{boat.name}</h3>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-secondary-emerald" /> {boat.location}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-slate-400 block uppercase font-bold">Base Night Rate</span>
                          <span className="text-lg font-extrabold text-primary-deep">₹{boat.pricePerNight.toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      {/* Owner summary line */}
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                        <div className="p-2 rounded-xl bg-white border border-slate-100 shadow-sm">
                          <User className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="text-xs font-bold text-slate-700">
                          <span className="text-[10px] text-slate-400 block font-semibold uppercase">Owner Partner</span>
                          <span>{boat.ownerName} • {boat.ownerEmail}</span>
                        </div>
                      </div>

                      {/* Quick Preview Tabs */}
                      <div className="space-y-2">
                        <div className="flex gap-1 border-b border-slate-100 pb-1">
                          {[
                            { id: 'certificates', label: 'Compliance Docs' },
                            { id: 'gallery', label: 'Image Deck' },
                            { id: 'amenities', label: 'Amenities List' }
                          ].map((tab) => (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setQuickPreviewTabs(prev => ({ ...prev, [boat.id]: tab.id as any }))}
                              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                                activeTab === tab.id 
                                  ? 'bg-slate-900 text-white shadow-sm'
                                  : 'text-slate-400 hover:text-slate-700'
                              }`}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>

                        {/* Tab Contents */}
                        <div className="min-h-[60px] text-xs font-bold text-slate-700 p-2">
                          {activeTab === 'certificates' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] font-semibold text-slate-500 font-mono">
                              <div>
                                <span className="text-slate-800 block font-sans font-bold">Pollution Cert: {boat.certificates.pollution.no}</span>
                                <span>Expiry: {boat.certificates.pollution.expiry}</span>
                                {boat.certificates.pollution.url && (
                                  <a href={boat.certificates.pollution.url} target="_blank" rel="noreferrer" className="text-indigo-600 underline block font-sans mt-0.5">View Pollution Document</a>
                                )}
                              </div>
                              <div>
                                <span className="text-slate-800 block font-sans font-bold">Safety Permit: {boat.certificates.safety.no}</span>
                                <span>Expiry: {boat.certificates.safety.expiry}</span>
                                {boat.certificates.safety.url && (
                                  <a href={boat.certificates.safety.url} target="_blank" rel="noreferrer" className="text-indigo-600 underline block font-sans mt-0.5">View Safety Document</a>
                                )}
                              </div>
                            </div>
                          )}

                          {activeTab === 'gallery' && (
                            <div className="flex gap-1.5 overflow-x-auto pb-1">
                              {boat.gallery.map((img: string, idx: number) => (
                                <img key={idx} src={img} alt="Gallery" className="w-16 h-12 object-cover rounded-lg border border-slate-100 shadow-sm shrink-0" />
                              ))}
                            </div>
                          )}

                          {activeTab === 'amenities' && (
                            <div className="flex flex-wrap gap-1">
                              {boat.amenities.map((am: string, idx: number) => (
                                <span key={idx} className="bg-slate-100 text-slate-600 text-[9px] px-2 py-0.5 rounded">{am}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick actions bar */}
                    <div className="flex justify-between items-center border-t border-slate-50 pt-4 mt-2">
                      <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-slate-300" />
                        <span>Verification ID: {boat.id.substring(0, 18).toUpperCase()}...</span>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedVessel(boat);
                          setIsDrawerOpen(true);
                          setIsRejecting(false);
                          setIsRequestingInfo(false);
                          setIsSuspending(false);
                        }}
                        className="bg-primary-deep hover:bg-slate-800 text-white font-bold px-4.5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                      >
                        <Eye className="w-4 h-4" /> View Details & Audit
                      </button>
                    </div>
                  </div>

                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-3xl p-12 border border-slate-100 shadow-premium text-center space-y-3">
              <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto" />
              <h3 className="font-heading text-sm font-bold text-primary-deep">All Clean! No Pending Listings</h3>
              <p className="text-xs text-slate-400 font-semibold max-w-sm mx-auto">There are currently no new vessels awaiting compliance audit reviews.</p>
            </div>
          )}
        </div>
      )}

      {/* Complete Audit Verification Drawer */}
      {isDrawerOpen && selectedVessel && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white h-full p-6 shadow-premium overflow-y-auto flex flex-col justify-between animate-in slide-in-from-right duration-300">
            
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="font-mono text-slate-400 text-[10px] uppercase">Reviewing ID: {selectedVessel.id.substring(0, 8).toUpperCase()}</span>
                  <h3 className="font-heading text-lg font-extrabold text-primary-deep">{selectedVessel.name}</h3>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Owner Information Card */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                <h4 className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Owner Profile Details</h4>
                <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-700">
                  <div>
                    <span className="text-[9px] text-slate-400 font-semibold block uppercase">Owner Name</span>
                    <span className="text-slate-800">{selectedVessel.ownerName}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-semibold block uppercase">Email Address</span>
                    <span className="text-slate-800 break-all">{selectedVessel.ownerEmail}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-semibold block uppercase">Phone Number</span>
                    <span className="text-slate-800">{selectedVessel.ownerPhone}</span>
                  </div>
                  {selectedVessel.hostProfile && (
                    <>
                      <div>
                        <span className="text-[9px] text-slate-400 font-semibold block uppercase">Company</span>
                        <span className="text-slate-800">{selectedVessel.hostProfile.companyName || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 font-semibold block uppercase">PAN Number</span>
                        <span className="text-slate-800 uppercase">{selectedVessel.hostProfile.panNumber}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 font-semibold block uppercase">Jurisdiction</span>
                        <span className="text-slate-800">{selectedVessel.hostProfile.portAuthority}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Vessel Information Card */}
              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-3">
                <h4 className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-slate-400" /> Vessel Technical Metrics
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-bold text-slate-700">
                  <div>
                    <span className="text-[9px] text-slate-400 font-semibold block uppercase">Category</span>
                    <span className="text-slate-800">{selectedVessel.category}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-semibold block uppercase">Location</span>
                    <span className="text-slate-800 line-clamp-1">{selectedVessel.location}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-semibold block uppercase">Bedrooms</span>
                    <span className="text-slate-800">{selectedVessel.bedrooms} Bedrooms</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-semibold block uppercase">Capacity</span>
                    <span className="text-slate-800">{selectedVessel.capacity} Guests</span>
                  </div>
                </div>
              </div>

              {/* Certificates & Uploaded Documents checklist */}
              <div className="space-y-3">
                <h4 className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Clearance Certificates Registry</h4>
                <div className="space-y-2">
                  {[
                    { label: 'Commercial Operations License', key: 'license' },
                    { label: 'Clean Water Pollution Certificate', key: 'pollution' },
                    { label: 'Operational Safety Permit', key: 'safety' },
                    { label: 'Vessel Hull & P&I Insurance Policy', key: 'insurance' }
                  ].map((doc) => {
                    const info = selectedVessel.certificates[doc.key];
                    return (
                      <div key={doc.key} className="border border-slate-100 rounded-xl p-3 flex justify-between items-center text-xs font-bold">
                        <div className="space-y-0.5">
                          <span className="text-slate-800">{doc.label}</span>
                          <span className="text-[9px] text-slate-400 block font-mono">No: {info.no} • Expiry: {info.expiry}</span>
                          {info.url && (
                            <a href={info.url} target="_blank" rel="noreferrer" className="text-indigo-600 underline block text-[9px] mt-0.5">Open Certificate Document</a>
                          )}
                        </div>
                        <span className={`text-[8px] font-bold px-2 py-0.5 rounded border uppercase ${
                          info.status === 'Verified' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {info.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Audit Timeline */}
              <div className="space-y-3">
                <h4 className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Application Audit Trail</h4>
                <div className="border-l border-slate-100 pl-4.5 ml-2.5 space-y-4 text-xs font-bold">
                  {selectedVessel.timeline.map((step: any, sIdx: number) => (
                    <div key={sIdx} className="relative">
                      <div className="absolute -left-[24.5px] top-1 w-2.5 h-2.5 rounded-full bg-slate-300 border-2 border-white" />
                      <div className="flex justify-between items-start">
                        <span className="text-slate-800 font-extrabold">{step.title}</span>
                        <span className="text-[9px] text-slate-400">{step.date}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-semibold leading-relaxed font-sans">{step.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Modals Forms */}
              {isRejecting && (
                <form onSubmit={handleReject} className="border-t border-slate-100 pt-4 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-rose-500 uppercase tracking-widest flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Rejection Reason *</label>
                    <textarea
                      required
                      rows={3}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Specify corrections needed (e.g. Pollution certificate document upload is blurred/corrupted. Please upload a clearer copy)..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setIsRejecting(false)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2 rounded-xl text-[10px] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2 rounded-xl text-[10px] cursor-pointer"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                </form>
              )}

              {isRequestingInfo && (
                <form onSubmit={handleRequestInfo} className="border-t border-slate-100 pt-4 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Compliance Review Instructions *</label>
                    <textarea
                      required
                      rows={3}
                      value={requestMessage}
                      onChange={(e) => setRequestMessage(e.target.value)}
                      placeholder="Instruct partner on missing documents/licensing updates (e.g. Please update and re-upload Pollution Certificate. Expiry date listed is incorrect)..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setIsRequestingInfo(false)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2 rounded-xl text-[10px] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-[10px] cursor-pointer"
                    >
                      Request Info
                    </button>
                  </div>
                </form>
              )}

              {isSuspending && (
                <form onSubmit={handleSuspend} className="border-t border-slate-100 pt-4 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Suspension Reason *</label>
                    <textarea
                      required
                      rows={3}
                      value={suspendReason}
                      onChange={(e) => setSuspendReason(e.target.value)}
                      placeholder="Provide suspension reason (e.g. Vessel reports mechanical failures. Temporary suspension pending safety audit review)..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setIsSuspending(false)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2 rounded-xl text-[10px] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2 rounded-xl text-[10px] cursor-pointer"
                    >
                      Confirm Suspension
                    </button>
                  </div>
                </form>
              )}

            </div>

            {/* Action buttons footer */}
            {!isRejecting && !isRequestingInfo && !isSuspending && (
              <div className="flex flex-wrap gap-2 justify-end pt-4 border-t border-slate-100 mt-6">
                {selectedVessel.status === 'Pending' || selectedVessel.status === 'Under Review' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsRejecting(true)}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold px-3 py-2.5 rounded-xl text-[11px] cursor-pointer uppercase tracking-wider"
                    >
                      Reject Listing
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsRequestingInfo(true)}
                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold px-3 py-2.5 rounded-xl text-[11px] cursor-pointer uppercase tracking-wider"
                    >
                      Request Info
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApprove(selectedVessel.id)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4.5 py-2.5 rounded-xl text-xs cursor-pointer shadow-md uppercase tracking-wider"
                    >
                      Approve Listing
                    </button>
                  </>
                ) : selectedVessel.status === 'Approved' ? (
                  <button
                    type="button"
                    onClick={() => setIsSuspending(true)}
                    className="bg-red-600 hover:bg-red-500 text-white font-bold px-4.5 py-2.5 rounded-xl text-xs cursor-pointer shadow-md uppercase tracking-wider"
                  >
                    Suspend Listing
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs text-center cursor-pointer uppercase tracking-wider"
                  >
                    Close Workspace
                  </button>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* Premium Approve Confirmation Modal */}
      {vesselToApprove && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-premium w-full max-w-sm space-y-6 animate-in zoom-in-95 duration-200 text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100 text-secondary-emerald animate-bounce">
              <ShieldCheck className="w-6 h-6" />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-heading text-base font-extrabold text-primary-deep">
                Publish Houseboat Listing?
              </h3>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed font-sans">
                Are you sure you want to approve this houseboat listing? This will immediately publish it to the customer guest portal.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setVesselToApprove(null)}
                className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetId = vesselToApprove;
                  setVesselToApprove(null);
                  proceedApproval(targetId);
                }}
                className="flex-1 bg-secondary-emerald hover:bg-secondary-emerald/90 text-white font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer shadow-md transition-all"
              >
                Approve & Publish
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
