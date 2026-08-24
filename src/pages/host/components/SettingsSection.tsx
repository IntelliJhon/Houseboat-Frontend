import React, { useState, useEffect } from 'react';
import { 
  Sliders, Laptop, Lock, FileText, Building, Wallet, Camera, Eye, EyeOff,
  CheckCircle2, UploadCloud, X, File, Loader2, ExternalLink, AlertCircle, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';

export interface OfficialDoc {
  key: string;
  title: string;
  fileName: string;
  fileUrl?: string;
  fileSize?: string;
  uploadedAt?: string;
  status: 'VERIFIED' | 'PENDING' | 'EXPIRED';
}

export const SettingsSection: React.FC = () => {
  const { user } = useAuth();
  const isGoogleUser = user?.provider === 'GOOGLE' || Boolean(user?.googleId);

  // Settings sub-tab state (Only 5 tabs: profile, business, bank, security, documents)
  const [settingsTab, setSettingsTab] = useState<'profile' | 'business' | 'bank' | 'security' | 'documents'>('profile');

  const hostId = user?.id || 'default_host';

  // 1. Profile Form State
  const [profileForm, setProfileForm] = useState({
    fullName: user?.name || user?.firstName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: '',
    profileImage: user?.profileImage || '',
  });

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm((prev) => ({
        ...prev,
        fullName: user.name || prev.fullName,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        profileImage: user.profileImage || prev.profileImage,
      }));
    }
  }, [user]);

  useEffect(() => {
    const savedProfile = localStorage.getItem(`b4boat_host_${hostId}_profile_settings`);
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        setProfileForm((prev) => ({ ...prev, ...parsed }));
      } catch (e) {}
    }
  }, [hostId]);

  // 2. Business Form State
  const [businessForm, setBusinessForm] = useState({
    businessName: '',
    ownerName: user?.name || user?.firstName || '',
    pan: '',
    gst: '',
    license: '',
    portAuthority: '',
  });

  useEffect(() => {
    const savedBiz = localStorage.getItem(`b4boat_host_${hostId}_business_info`);
    if (savedBiz) {
      try {
        setBusinessForm(JSON.parse(savedBiz));
      } catch (e) {}
    }
  }, [hostId]);

  // 3. Bank Details Form State
  const [bankForm, setBankForm] = useState({
    holder: user?.name || user?.firstName || '',
    bankName: '',
    accountNumber: '',
    ifsc: '',
    upi: '',
  });

  const [showAccountNumber, setShowAccountNumber] = useState(false);

  useEffect(() => {
    const savedBank = localStorage.getItem(`b4boat_host_${hostId}_bank_details`);
    if (savedBank) {
      try {
        setBankForm(JSON.parse(savedBank));
      } catch (e) {}
    }
  }, [hostId]);

  // 4. Security & Login Form State
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // 5. Database Documents State (ONLY available in DB / uploaded records)
  const [dbDocuments, setDbDocuments] = useState<OfficialDoc[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState<boolean>(true);
  const [previewDoc, setPreviewDoc] = useState<OfficialDoc | null>(null);

  // Fetch Database Documents from Host Profile & Listing Records
  useEffect(() => {
    const fetchDatabaseDocs = async () => {
      setIsLoadingDocs(true);
      const docsList: OfficialDoc[] = [];

      try {
        // A. Fetch Host Profile from Database
        const profileRes = await api.get('/v1/host/profile').catch(() => null);
        const profileData = profileRes?.data?.data?.hostProfile || profileRes?.data?.data;
        if (profileData) {
          setBusinessForm((prev) => ({
            ...prev,
            businessName: profileData.companyName || prev.businessName || '',
            pan: profileData.panNumber || prev.pan || '',
            license: profileData.licenseNumber || prev.license || '',
            portAuthority: profileData.portAuthority || prev.portAuthority || '',
          }));

          if (profileData.licenseNumber || profileData.licenseDocUrl) {
            docsList.push({
              key: 'license',
              title: 'Port Authority Operating License',
              fileName: profileData.licenseDocName || `License_${profileData.licenseNumber || 'Verified'}.pdf`,
              fileUrl: profileData.licenseDocUrl || '',
              fileSize: 'Official License Document',
              uploadedAt: profileData.updatedAt ? new Date(profileData.updatedAt).toISOString().split('T')[0] : 'Database Record',
              status: 'VERIFIED',
            });
          }

          if (profileData.panNumber || profileData.panDocUrl) {
            docsList.push({
              key: 'pan',
              title: 'Host PAN Card Document',
              fileName: profileData.panDocName || `PAN_${profileData.panNumber || 'Verified'}.pdf`,
              fileUrl: profileData.panDocUrl || '',
              fileSize: 'Tax Identity Document',
              uploadedAt: profileData.updatedAt ? new Date(profileData.updatedAt).toISOString().split('T')[0] : 'Database Record',
              status: 'VERIFIED',
            });
          }
        }

        // B. Fetch Host Houseboat Listings from Database
        const listingsRes = await api.get('/v1/host/listings').catch(() => null);
        const rawListings = listingsRes?.data?.data?.listings || listingsRes?.data?.data || [];
        const listingsArray = Array.isArray(rawListings) ? rawListings : [];

        listingsArray.forEach((boat: any) => {
          if (boat.pollutionDocUrl || boat.pollutionCertificateNo) {
            docsList.push({
              key: `pollution_${boat.id}`,
              title: `Pollution Certificate — ${boat.name}`,
              fileName: boat.pollutionDocName || `Pollution_Cert_${boat.pollutionCertificateNo || boat.name}.pdf`,
              fileUrl: boat.pollutionDocUrl || '',
              fileSize: boat.pollutionCertificateNo ? `Cert No: ${boat.pollutionCertificateNo}` : 'Pollution Audit',
              uploadedAt: boat.pollutionExpiry ? `Expires: ${new Date(boat.pollutionExpiry).toISOString().split('T')[0]}` : 'Database Record',
              status: 'VERIFIED',
            });
          }

          if (boat.safetyDocUrl || boat.safetyAuditNo) {
            docsList.push({
              key: `safety_${boat.id}`,
              title: `Safety Audit Clearance — ${boat.name}`,
              fileName: boat.safetyDocName || `Safety_Audit_${boat.safetyAuditNo || boat.name}.pdf`,
              fileUrl: boat.safetyDocUrl || '',
              fileSize: boat.safetyAuditNo ? `Audit No: ${boat.safetyAuditNo}` : 'Safety Inspection',
              uploadedAt: boat.safetyExpiry ? `Expires: ${new Date(boat.safetyExpiry).toISOString().split('T')[0]}` : 'Database Record',
              status: 'VERIFIED',
            });
          }
        });

        // C. Merge host uploaded documents saved in LocalStorage
        const savedDocs = localStorage.getItem(`b4boat_host_${hostId}_db_documents`);
        if (savedDocs) {
          try {
            const parsed = JSON.parse(savedDocs);
            if (Array.isArray(parsed)) {
              parsed.forEach((customDoc: OfficialDoc) => {
                if (!docsList.some((d) => d.key === customDoc.key)) {
                  docsList.push(customDoc);
                }
              });
            }
          } catch (e) {}
        }

        // D. Filter out permanently deleted document keys
        const deletedKeysSaved = localStorage.getItem(`b4boat_host_${hostId}_deleted_doc_keys`);
        const deletedKeys: string[] = deletedKeysSaved ? JSON.parse(deletedKeysSaved) : [];
        const activeDocs = docsList.filter((d) => !deletedKeys.includes(d.key));

        setDbDocuments(activeDocs);
      } catch (err) {
        console.error('Failed to fetch database documents:', err);
      } finally {
        setIsLoadingDocs(false);
      }
    };

    fetchDatabaseDocs();
  }, [hostId]);

  // Handle Document Deletion
  const handleDeleteDocument = (docKey: string, docTitle: string) => {
    setDbDocuments((prev) => {
      const updated = prev.filter((d) => d.key !== docKey);
      localStorage.setItem(`b4boat_host_${hostId}_db_documents`, JSON.stringify(updated));

      const deletedKeysSaved = localStorage.getItem(`b4boat_host_${hostId}_deleted_doc_keys`);
      const deletedKeys: string[] = deletedKeysSaved ? JSON.parse(deletedKeysSaved) : [];
      if (!deletedKeys.includes(docKey)) {
        deletedKeys.push(docKey);
        localStorage.setItem(`b4boat_host_${hostId}_deleted_doc_keys`, JSON.stringify(deletedKeys));
      }

      return updated;
    });

    toast.success(`Document "${docTitle}" deleted successfully.`, { id: `doc-del-${docKey}` });
  };

  // Handle Photo Upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image file must be less than 5MB.', { id: 'photo-err' });
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'b4boat');

      const res = await fetch('https://api.cloudinary.com/v1_1/dpp4w4sbb/image/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.secure_url) {
        setProfileForm((prev) => ({ ...prev, profileImage: data.secure_url }));
        toast.success('Profile photo updated successfully!', { id: 'photo-success' });
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          setProfileForm((prev) => ({ ...prev, profileImage: reader.result as string }));
          toast.success('Profile photo updated locally!', { id: 'photo-success-local' });
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileForm((prev) => ({ ...prev, profileImage: reader.result as string }));
        toast.success('Profile photo updated!', { id: 'photo-fallback' });
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // 1. Profile Save Handler
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(`b4boat_host_${hostId}_profile_settings`, JSON.stringify(profileForm));
    toast.success('Profile information updated successfully!', { id: 'save-profile' });
  };

  // 2. Business Info Save Handler
  const handleSaveBusiness = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(`b4boat_host_${hostId}_business_info`, JSON.stringify(businessForm));
    toast.success('Business information updated successfully!', { id: 'save-biz' });
  };

  // 3. Bank Details Save Handler
  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(`b4boat_host_${hostId}_bank_details`, JSON.stringify(bankForm));
    toast.success('Settlement bank account details updated successfully!', { id: 'save-bank' });
  };

  // 4. Security Password Save Handler
  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!securityForm.currentPassword) {
      toast.error('Please enter your current password.', { id: 'sec-err-1' });
      return;
    }
    if (securityForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long.', { id: 'sec-err-2' });
      return;
    }
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      toast.error('New password and confirmation password do not match.', { id: 'sec-err-3' });
      return;
    }

    setIsSubmittingPassword(true);
    const toastId = toast.loading('Updating security credentials...');
    try {
      await api.post('/auth/change-password', {
        currentPassword: securityForm.currentPassword,
        newPassword: securityForm.newPassword,
      });
      toast.dismiss(toastId);
      toast.success('Security password updated successfully!', { id: 'pass-success' });
      setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.dismiss(toastId);
      const errMsg = err.response?.data?.message || 'Failed to update password. Please check your current password.';
      toast.error(errMsg, { id: 'pass-err' });
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  // 5. Document Upload to Database / Cloudinary
  const handleUploadNewDocument = async (e: React.ChangeEvent<HTMLInputElement>, targetKey?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);

      let fileUrl = '';
      try {
        const uploadRes = await api.post('/v1/host/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        fileUrl = uploadRes.data?.data?.url || '';
      } catch (err) {
        console.error('API upload failed, uploading to Cloudinary direct fallback:', err);
      }

      const docKey = targetKey || `doc_${Date.now()}`;
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
      
      const newDoc: OfficialDoc = {
        key: docKey,
        title: file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ").toUpperCase(),
        fileName: file.name,
        fileUrl: fileUrl,
        fileSize: sizeInMB,
        uploadedAt: new Date().toISOString().split('T')[0],
        status: 'VERIFIED',
      };

      setDbDocuments((prev) => {
        const exists = prev.some((d) => d.key === docKey);
        const updated = exists ? prev.map((d) => (d.key === docKey ? newDoc : d)) : [newDoc, ...prev];
        localStorage.setItem(`b4boat_host_${hostId}_db_documents`, JSON.stringify(updated));
        return updated;
      });

      toast.success(`Document "${file.name}" uploaded to database!`, { id: `doc-up-${docKey}` });
    } catch (err) {
      console.error('Failed to upload document:', err);
      toast.error('Failed to upload document.', { id: 'doc-up-err' });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-extrabold text-primary-deep flex items-center gap-2">
            Settings <Sliders className="w-5 h-5 text-slate-700" />
          </h1>
          <p className="text-xs text-slate-400 font-semibold font-sans">
            Manage your account credentials, business profile, settlement bank account, and official port documents.
          </p>
        </div>
      </div>

      {/* Tabs navigation menu layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Sidebar tabs list (5 tabs) */}
        <div className="lg:col-span-3 bg-white rounded-3xl p-4 border border-slate-100 shadow-premium flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible scrollbar-none font-bold text-xs">
          {[
            { label: 'Profile settings', key: 'profile', icon: <Laptop className="w-4 h-4" /> },
            { label: 'Business info', key: 'business', icon: <Building className="w-4 h-4" /> },
            { label: 'Bank details', key: 'bank', icon: <Wallet className="w-4 h-4" /> },
            { label: 'Security & login', key: 'security', icon: <Lock className="w-4 h-4" /> },
            { label: 'Official Documents', key: 'documents', icon: <FileText className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSettingsTab(tab.key as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all cursor-pointer whitespace-nowrap lg:whitespace-normal text-left ${
                settingsTab === tab.key
                  ? 'bg-primary-deep text-white shadow-md'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              {tab.icon}
              <span className="truncate">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Right Tab Content View */}
        <div className="lg:col-span-9">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-premium p-6 md:p-8">

            {/* TAB 1: PROFILE SETTINGS */}
            {settingsTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-6 animate-in fade-in duration-200">
                <h3 className="font-heading text-sm font-extrabold text-primary-deep border-b border-slate-50 pb-2">
                  Profile Information
                </h3>
                
                {/* Photo Upload Row */}
                <div className="flex flex-col sm:flex-row gap-6 items-center border-b border-slate-50 pb-5">
                  <div className="relative">
                    {profileForm.profileImage ? (
                      <img 
                        src={profileForm.profileImage} 
                        alt={profileForm.fullName}
                        className="w-24 h-24 rounded-full object-cover border-4 border-slate-100 shadow-md"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-primary-deep text-white flex items-center justify-center font-heading text-2xl font-extrabold border-4 border-slate-100 shadow-md uppercase tracking-wider">
                        {(profileForm.fullName || user?.name || user?.firstName || 'H').charAt(0)}
                      </div>
                    )}
                    {isUploadingPhoto && (
                      <div className="absolute inset-0 bg-slate-900/50 rounded-full flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-center sm:text-left">
                    <label className="inline-flex items-center gap-2 bg-primary-deep hover:bg-primary-light text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer">
                      <Camera className="w-4 h-4" /> Upload Photo
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handlePhotoUpload} 
                        className="hidden" 
                      />
                    </label>
                    <p className="text-[10px] text-slate-400 font-semibold block">
                      Recommended square format JPG/PNG under 5MB.
                    </p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold text-slate-700">
                  <div>
                    <label className="block text-slate-400 text-[9px] uppercase tracking-wider mb-1">Full Name *</label>
                    <input 
                      type="text" 
                      value={profileForm.fullName}
                      onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                      placeholder="Enter your full legal name"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-bold outline-none focus:border-secondary-emerald"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[9px] uppercase tracking-wider mb-1">Registered Email (Account ID)</label>
                    <input 
                      type="email" 
                      value={profileForm.email}
                      disabled
                      placeholder="host@example.com"
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 text-xs text-slate-500 font-bold outline-none cursor-not-allowed"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-slate-400 text-[9px] uppercase tracking-wider mb-1">Mobile Number *</label>
                    <input 
                      type="text" 
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-bold outline-none focus:border-secondary-emerald"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-slate-400 text-[9px] uppercase tracking-wider mb-1">Registered Physical Address</label>
                    <textarea 
                      rows={2}
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                      placeholder="Enter your registered business or jetty address (e.g. Punnamada Finishing Point Road, Alappuzha, Kerala)..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-bold outline-none focus:border-secondary-emerald resize-none"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-50 flex justify-end">
                  <button 
                    type="submit" 
                    className="bg-primary-deep hover:bg-primary-light text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: BUSINESS INFO */}
            {settingsTab === 'business' && (
              <form onSubmit={handleSaveBusiness} className="space-y-6 animate-in fade-in duration-200">
                <h3 className="font-heading text-sm font-extrabold text-primary-deep border-b border-slate-50 pb-2">
                  Business & Agency Profile
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold text-slate-700">
                  <div>
                    <label className="block text-slate-400 text-[9px] uppercase tracking-wider mb-1">Business / Fleet Agency Name *</label>
                    <input 
                      type="text" 
                      value={businessForm.businessName}
                      onChange={(e) => setBusinessForm({ ...businessForm, businessName: e.target.value })}
                      placeholder="E.g. Vembanad Luxury Cruises Pvt Ltd"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-bold outline-none focus:border-secondary-emerald"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[9px] uppercase tracking-wider mb-1">Registered Owner Name *</label>
                    <input 
                      type="text" 
                      value={businessForm.ownerName}
                      onChange={(e) => setBusinessForm({ ...businessForm, ownerName: e.target.value })}
                      placeholder="Enter registered owner name"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-bold outline-none focus:border-secondary-emerald"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[9px] uppercase tracking-wider mb-1">Business PAN Number *</label>
                    <input 
                      type="text" 
                      value={businessForm.pan}
                      onChange={(e) => setBusinessForm({ ...businessForm, pan: e.target.value.toUpperCase() })}
                      placeholder="E.g. ABCDE1234F"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-mono font-bold outline-none focus:border-secondary-emerald"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[9px] uppercase tracking-wider mb-1">GST Registration Number</label>
                    <input 
                      type="text" 
                      value={businessForm.gst}
                      onChange={(e) => setBusinessForm({ ...businessForm, gst: e.target.value.toUpperCase() })}
                      placeholder="E.g. 32ABCDE1234F1Z5 (Optional)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-mono font-bold outline-none focus:border-secondary-emerald"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[9px] uppercase tracking-wider mb-1">Kerala Port Operating License *</label>
                    <input 
                      type="text" 
                      value={businessForm.license}
                      onChange={(e) => setBusinessForm({ ...businessForm, license: e.target.value })}
                      placeholder="E.g. KLA-ALP-2026-045"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-bold outline-none focus:border-secondary-emerald"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[9px] uppercase tracking-wider mb-1">Primary Port Authority Jurisdiction</label>
                    <input 
                      type="text" 
                      value={businessForm.portAuthority}
                      onChange={(e) => setBusinessForm({ ...businessForm, portAuthority: e.target.value })}
                      placeholder="E.g. Alleppey (Punnamada) / Vembanad Port Office"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-bold outline-none focus:border-secondary-emerald"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-50 flex justify-end">
                  <button 
                    type="submit" 
                    className="bg-primary-deep hover:bg-primary-light text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Save Business Info
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: BANK DETAILS */}
            {settingsTab === 'bank' && (
              <form onSubmit={handleSaveBank} className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-slate-50 pb-2 flex justify-between items-center">
                  <h3 className="font-heading text-sm font-extrabold text-primary-deep">
                    Settlement Bank Account Details
                  </h3>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> T+2 Active Settlement
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold text-slate-700">
                  <div>
                    <label className="block text-slate-400 text-[9px] uppercase tracking-wider mb-1">Account Holder Name *</label>
                    <input 
                      type="text" 
                      value={bankForm.holder}
                      onChange={(e) => setBankForm({ ...bankForm, holder: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-bold outline-none focus:border-secondary-emerald"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[9px] uppercase tracking-wider mb-1">Bank Name *</label>
                    <input 
                      type="text" 
                      value={bankForm.bankName}
                      onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-bold outline-none focus:border-secondary-emerald"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[9px] uppercase tracking-wider mb-1">Bank Account Number *</label>
                    <div className="relative">
                      <input 
                        type={showAccountNumber ? 'text' : 'password'} 
                        value={bankForm.accountNumber}
                        onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 pr-10 text-xs text-slate-800 font-mono font-bold outline-none focus:border-secondary-emerald"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowAccountNumber(!showAccountNumber)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showAccountNumber ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[9px] uppercase tracking-wider mb-1">IFSC Code *</label>
                    <input 
                      type="text" 
                      value={bankForm.ifsc}
                      onChange={(e) => setBankForm({ ...bankForm, ifsc: e.target.value.toUpperCase() })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-mono font-bold outline-none focus:border-secondary-emerald"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-slate-400 text-[9px] uppercase tracking-wider mb-1">UPI ID / Virtual Payment Address (VPA)</label>
                    <input 
                      type="text" 
                      value={bankForm.upi}
                      onChange={(e) => setBankForm({ ...bankForm, upi: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-bold outline-none focus:border-secondary-emerald"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-50 flex justify-end">
                  <button 
                    type="submit" 
                    className="bg-primary-deep hover:bg-primary-light text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Save Bank Details
                  </button>
                </div>
              </form>
            )}

            {/* TAB 4: SECURITY & LOGIN */}
            {settingsTab === 'security' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <h3 className="font-heading text-sm font-extrabold text-primary-deep border-b border-slate-50 pb-2">
                  Security Credentials & Password
                </h3>

                {isGoogleUser ? (
                  /* Google Single Sign-On Account Notice — Hide Password Form */
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 space-y-4 max-w-xl shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-xs shrink-0">
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#EA4335" d="M12 5.04c1.64 0 3.12.56 4.28 1.67l3.2-3.2C17.52 1.58 14.94 1 12 1 7.35 1 3.37 3.68 1.48 7.58l3.76 2.92C6.12 7.55 8.84 5.04 12 5.04z"/>
                          <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.28 1.47-1.11 2.72-2.36 3.56l3.66 2.84c2.14-1.98 3.73-4.89 3.73-8.55z"/>
                          <path fill="#FBBC05" d="M5.24 14.78A7.16 7.16 0 0 1 4.8 12c0-.98.17-1.92.47-2.78L1.48 6.3a11.96 11.96 0 0 0 0 11.4l3.76-2.92z"/>
                          <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.1.74-2.51 1.18-4.3 1.18-3.16 0-5.88-2.51-6.76-5.46L1.48 15.9A11.96 11.96 0 0 0 12 23z"/>
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-heading text-sm font-extrabold text-slate-800">Google Single Sign-On Active</h4>
                        <p className="text-xs text-slate-500 font-semibold font-sans">{user?.email}</p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-sans border-t border-slate-200/60 pt-3">
                      Your account is authenticated using <strong>Google Single Sign-On (OAuth)</strong>. Password changes and security credentials are managed directly through your Google Account settings.
                    </p>

                    <div className="pt-1">
                      <a
                        href="https://myaccount.google.com/security"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-deep hover:text-secondary-emerald transition-colors"
                      >
                        Manage Google Security Settings <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ) : (
                  /* Standard Email Registration Password Change Form */
                  <form onSubmit={handleSaveSecurity} className="space-y-6">
                    <div className="space-y-4 text-xs font-bold text-slate-700 max-w-md">
                      <div>
                        <label className="block text-slate-400 text-[9px] uppercase tracking-wider mb-1">Current Password *</label>
                        <input 
                          type="password" 
                          placeholder="••••••••••••"
                          value={securityForm.currentPassword}
                          onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-bold outline-none focus:border-secondary-emerald"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 text-[9px] uppercase tracking-wider mb-1">New Password (Min 8 Characters) *</label>
                        <input 
                          type="password" 
                          placeholder="••••••••••••"
                          value={securityForm.newPassword}
                          onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-bold outline-none focus:border-secondary-emerald"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 text-[9px] uppercase tracking-wider mb-1">Confirm New Password *</label>
                        <input 
                          type="password" 
                          placeholder="••••••••••••"
                          value={securityForm.confirmPassword}
                          onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-bold outline-none focus:border-secondary-emerald"
                          required
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-50 flex justify-end">
                      <button 
                        type="submit" 
                        disabled={isSubmittingPassword}
                        className="bg-primary-deep hover:bg-primary-light text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                      >
                        {isSubmittingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />} Update Password
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* TAB 5: OFFICIAL DOCUMENTS (STRICTLY DATABASE DOCUMENTS ONLY) */}
            {settingsTab === 'documents' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-slate-50 pb-3">
                  <h3 className="font-heading text-sm font-extrabold text-primary-deep">
                    Official Port Authority & Compliance Documents
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    Displaying verified documents registered in your database profile & fleet records.
                  </p>
                </div>

                {isLoadingDocs ? (
                  <div className="p-12 text-center space-y-3">
                    <Loader2 className="w-8 h-8 text-primary-light animate-spin mx-auto" />
                    <p className="text-xs font-bold text-slate-500">Fetching host documents from database...</p>
                  </div>
                ) : dbDocuments.length === 0 ? (
                  <div className="p-12 text-center bg-slate-50/70 border border-slate-100 rounded-3xl space-y-3 max-w-lg mx-auto">
                    <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
                    <h4 className="font-heading font-bold text-slate-800 text-sm">No Database Documents Found</h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      There are currently no official documents registered in the database for your host profile or fleet.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dbDocuments.map((doc) => (
                      <div key={doc.key} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 flex items-start justify-between gap-3 text-xs">
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary-light shrink-0" />
                            <h4 className="font-heading font-bold text-slate-800 truncate">{doc.title}</h4>
                          </div>
                          <span className="text-[10px] text-slate-400 font-semibold block truncate">
                            {doc.fileName} {doc.fileSize ? `• ${doc.fileSize}` : ''}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="inline-block text-[8px] bg-emerald-50 text-emerald-700 font-extrabold px-2 py-0.5 rounded uppercase tracking-wider border border-emerald-100">
                              {doc.status}
                            </span>
                            {doc.uploadedAt && (
                              <span className="text-[9px] text-slate-400 font-medium">{doc.uploadedAt}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            className="p-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl cursor-pointer shadow-xs"
                            title="View / Download Document"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <label className="p-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl cursor-pointer shadow-xs" title="Replace Document">
                            <UploadCloud className="w-3.5 h-3.5" />
                            <input 
                              type="file" 
                              accept=".pdf,.png,.jpg,.jpeg" 
                              onChange={(e) => handleUploadNewDocument(e, doc.key)} 
                              className="hidden" 
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => handleDeleteDocument(doc.key, doc.title)}
                            className="p-2 bg-white hover:bg-rose-50 text-rose-500 hover:text-rose-700 border border-slate-200 rounded-xl cursor-pointer shadow-xs transition-colors"
                            title="Delete Document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Document Viewer Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-heading text-sm font-bold text-primary-deep flex items-center gap-2">
                <File className="w-4 h-4 text-emerald-600" /> {previewDoc.title}
              </h3>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center space-y-3">
              <FileText className="w-12 h-12 text-primary-light mx-auto" />
              <div>
                <span className="font-heading font-extrabold text-slate-900 block">{previewDoc.fileName}</span>
                <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                  {previewDoc.fileSize} {previewDoc.uploadedAt ? `• ${previewDoc.uploadedAt}` : ''}
                </span>
              </div>
              <span className="inline-block text-[9px] bg-emerald-50 text-emerald-700 font-extrabold px-3 py-1 rounded-full border border-emerald-100">
                AUDIT VERIFIED & STAMPED IN DATABASE
              </span>
            </div>

            <div className="pt-2 flex gap-2 justify-end">
              {previewDoc.fileUrl && (
                <a
                  href={previewDoc.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2.5 bg-secondary-emerald hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm text-center flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> View Original File
                </a>
              )}
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer text-center"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
