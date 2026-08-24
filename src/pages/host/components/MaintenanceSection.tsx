import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building, AlertCircle, Wrench, Check, Calendar, ShieldCheck, CheckSquare, Square,
  Plus, FileText, X, Trash2, Anchor, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import type { Houseboat } from '../HostDashboard';

interface MaintenanceSectionProps {
  fleet?: Houseboat[];
}

export interface MaintenanceJob {
  id: string;
  boatId: string;
  boatName: string;
  boatImage: string;
  type: string;
  lastServiceDate: string;
  nextServiceDate: string;
  technician: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Scheduled' | 'Overdue' | 'Underway' | 'Completed';
  cost: number;
  notes?: string;
  createdAt: string;
}

export const MaintenanceSection: React.FC<MaintenanceSectionProps> = ({ fleet: propFleet = [] }) => {
  const { user } = useAuth();
  const [fetchedFleet, setFetchedFleet] = useState<Houseboat[]>([]);
  const [isLoadingFleet, setIsLoadingFleet] = useState(false);
  const [maintenanceFilter, setMaintenanceFilter] = useState<'all' | 'upcoming' | 'today' | 'completed' | 'overdue'>('all');

  // Modals state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [rescheduleJob, setRescheduleJob] = useState<MaintenanceJob | null>(null);
  const [selectedAuditJob, setSelectedAuditJob] = useState<MaintenanceJob | null>(null);
  const [newRescheduleDate, setNewRescheduleDate] = useState('');

  // Fetch host houseboats directly if propFleet is empty
  useEffect(() => {
    if (propFleet.length === 0) {
      const fetchListings = async () => {
        setIsLoadingFleet(true);
        try {
          const res = await api.get('/v1/host/listings');
          const list = res.data?.data?.listings || [];
          const mapped: Houseboat[] = list.map((b: any) => ({
            id: b.id,
            name: b.name,
            category: b.category || 'Premium',
            status: b.status === 'APPROVED' ? 'Approved' : 'Pending Approval',
            bedrooms: b.bedrooms,
            capacity: b.capacity,
            pricePerNight: b.pricePerNight,
            location: b.location || 'Alleppey',
            rating: b.averageRating || 4.9,
            todayStatus: 'Available',
            monthlyOccupancy: 85,
            monthlyRevenue: 120000,
            upcomingTripDate: 'Today',
            lastUpdated: 'Just now',
            image: b.images?.[0] || 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=600&q=80',
            images: b.images || [],
          }));
          setFetchedFleet(mapped);
        } catch (err) {
          console.error('Failed to fetch host listings for maintenance:', err);
        } finally {
          setIsLoadingFleet(false);
        }
      };
      fetchListings();
    }
  }, [propFleet]);

  const activeFleet = propFleet.length > 0 ? propFleet : fetchedFleet;

  // LocalStorage Storage Keys based on logged-in user
  const hostId = user?.id || 'default_host';
  const storageKey = `b4boat_host_${hostId}_maintenance_jobs_v2`;
  const complianceKey = `b4boat_host_${hostId}_compliance_checklist_v2`;

  // Form State for new Maintenance Job
  const [newJob, setNewJob] = useState({
    boatId: '',
    type: 'Engine Service & Oil Change',
    nextServiceDate: new Date().toISOString().split('T')[0],
    technician: '',
    priority: 'Medium' as 'High' | 'Medium' | 'Low',
    cost: '',
    notes: '',
  });

  // Dynamic Initial Seed generator derived exclusively from active host vessels
  const defaultFleetJobs = useMemo<MaintenanceJob[]>(() => {
    if (activeFleet.length === 0) return [];

    return activeFleet.map((boat, idx) => {
      const today = new Date();
      const nextDate = new Date();
      nextDate.setDate(today.getDate() + (idx === 0 ? 14 : idx === 1 ? -3 : 25));

      const isOverdue = nextDate < today;

      return {
        id: `MNT-${Math.floor(1000 + idx * 45)}`,
        boatId: boat.id,
        boatName: boat.name,
        boatImage: boat.images?.[0] || boat.image || 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=600&q=80',
        type: idx % 2 === 0 ? 'Engine & Electrical Audit' : 'Port Safety & Hull Inspection',
        lastServiceDate: new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString().split('T')[0],
        nextServiceDate: nextDate.toISOString().split('T')[0],
        technician: user?.name ? `Capt. ${user.name} & Marine Crew` : 'Chief Marine Engineer',
        priority: isOverdue ? 'High' : 'Medium',
        status: isOverdue ? 'Overdue' : 'Scheduled',
        cost: idx % 2 === 0 ? 18000 : 24000,
        notes: `Scheduled periodic vessel inspection and maintenance service for ${boat.name}.`,
        createdAt: new Date().toISOString(),
      };
    });
  }, [activeFleet, user]);

  // Load maintenance list from local storage or default fleet jobs
  const [isLoaded, setIsLoaded] = useState(false);
  const [maintenanceList, setMaintenanceList] = useState<MaintenanceJob[]>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Failed to parse stored maintenance jobs:', e);
      }
    }
    return defaultFleetJobs;
  });

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setMaintenanceList(parsed);
          setIsLoaded(true);
          return;
        }
      } catch (e) {}
    }

    if (!isLoaded && defaultFleetJobs.length > 0) {
      setMaintenanceList(defaultFleetJobs);
    }
    setIsLoaded(true);
  }, [storageKey, defaultFleetJobs.length]);

  // Permanently sync to local storage whenever maintenanceList changes (including when empty or deleted)
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(storageKey, JSON.stringify(maintenanceList));
    }
  }, [maintenanceList, storageKey, isLoaded]);

  // Safety compliance checklist
  const [complianceList, setComplianceList] = useState<{ [key: string]: boolean }>(() => {
    const saved = localStorage.getItem(complianceKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      lifeJackets: true,
      fireExtinguisher: true,
      emergencyKit: true,
      pollutionCert: true,
      portInspection: true,
    };
  });

  useEffect(() => {
    localStorage.setItem(complianceKey, JSON.stringify(complianceList));
  }, [complianceList, complianceKey]);

  // Handle Mark Job Completed
  const handleMarkMaintenanceCompleted = (id: string) => {
    const target = maintenanceList.find((m) => m.id === id);
    if (target) {
      toast.success(`Maintenance job for ${target.boatName} marked as Completed!`, { id: `complete-${id}` });
    }
    setMaintenanceList((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: 'Completed' as const } : m))
    );
  };

  // Handle Delete Maintenance Job
  const handleDeleteJob = (id: string, boatName: string) => {
    toast.success(`Maintenance ticket #${id} for ${boatName} deleted.`, { id: `delete-${id}` });
    setMaintenanceList((prev) => prev.filter((m) => m.id !== id));
  };

  // Handle Reschedule Submit
  const handleConfirmReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleJob || !newRescheduleDate) return;

    toast.success(`Service date for ${rescheduleJob.boatName} rescheduled to ${newRescheduleDate}.`, { id: `reschedule-${rescheduleJob.id}` });
    setMaintenanceList((prev) =>
      prev.map((m) => {
        if (m.id === rescheduleJob.id) {
          return { ...m, nextServiceDate: newRescheduleDate, status: 'Scheduled' as const };
        }
        return m;
      })
    );
    setRescheduleJob(null);
    setNewRescheduleDate('');
  };

  // Handle Create Maintenance Job Submit
  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJob.boatId) {
      toast.error('Please select a vessel from your fleet.', { id: 'job-err-1' });
      return;
    }

    const selectedBoat = activeFleet.find((b) => b.id === newJob.boatId);
    if (!selectedBoat) {
      toast.error('Selected houseboat not found in your fleet.', { id: 'job-err-2' });
      return;
    }

    const created: MaintenanceJob = {
      id: `MNT-${Math.floor(1000 + Math.random() * 9000)}`,
      boatId: selectedBoat.id,
      boatName: selectedBoat.name,
      boatImage: selectedBoat.images?.[0] || selectedBoat.image || 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=600&q=80',
      type: newJob.type,
      lastServiceDate: new Date().toISOString().split('T')[0],
      nextServiceDate: newJob.nextServiceDate,
      technician: newJob.technician || (user?.name ? `Capt. ${user.name}` : 'Marine Engineering Specialist'),
      priority: newJob.priority,
      status: 'Scheduled',
      cost: Number(newJob.cost) || 15000,
      notes: newJob.notes || `Scheduled vessel maintenance service for ${selectedBoat.name}.`,
      createdAt: new Date().toISOString(),
    };

    setMaintenanceList((prev) => [created, ...prev]);
    toast.success(`Maintenance ticket #${created.id} created for ${created.boatName}!`, { id: `created-${created.id}` });
    setIsScheduleModalOpen(false);
    setNewJob({
      boatId: '',
      type: 'Engine Service & Oil Change',
      nextServiceDate: new Date().toISOString().split('T')[0],
      technician: '',
      priority: 'Medium',
      cost: '',
      notes: '',
    });
  };

  const toggleComplianceItem = (item: string) => {
    setComplianceList((prev: any) => ({ ...prev, [item]: !prev[item] }));
    toast.success('Port safety clearance updated.', { id: 'compliance-toast' });
  };

  // Dynamic KPI Calculations
  const totalVessels = activeFleet.length;
  const underMaintenance = maintenanceList.filter((m) => m.status === 'Underway').length;
  const maintenanceDue = maintenanceList.filter((m) => m.status === 'Overdue').length;
  const completedJobsCount = maintenanceList.filter((m) => m.status === 'Completed').length;
  const upcomingInspections = maintenanceList.filter((m) => m.status === 'Scheduled').length;

  const passedComplianceCount = Object.values(complianceList).filter(Boolean).length;
  const totalComplianceItems = Object.keys(complianceList).length;
  const compliancePercentage = totalComplianceItems > 0 ? Math.round((passedComplianceCount / totalComplianceItems) * 100) : 100;

  const filteredMaintenance = useMemo(() => {
    return maintenanceList.filter((m) => {
      if (maintenanceFilter === 'all') return true;
      if (maintenanceFilter === 'upcoming') return m.status === 'Scheduled';
      if (maintenanceFilter === 'today') return m.status === 'Underway';
      if (maintenanceFilter === 'completed') return m.status === 'Completed';
      if (maintenanceFilter === 'overdue') return m.status === 'Overdue';
      return true;
    });
  }, [maintenanceList, maintenanceFilter]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-extrabold text-primary-deep flex items-center gap-2">
            Maintenance Management <Wrench className="w-5 h-5 text-amber-600" />
          </h1>
          <p className="text-xs text-slate-400 font-semibold font-sans">
            Manage maintenance schedules, inspections, repairs, and operational compliance for your fleet.
          </p>
        </div>

        {activeFleet.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setNewJob((prev) => ({ ...prev, boatId: activeFleet[0].id }));
              setIsScheduleModalOpen(true);
            }}
            className="bg-secondary-emerald hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Schedule Maintenance
          </button>
        )}
      </div>

      {/* Top Summary stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Fleet', val: `${totalVessels} Vessel${totalVessels !== 1 ? 's' : ''}`, icon: <Building className="w-4 h-4 text-slate-500" /> },
          { label: 'Maintenance Due', val: `${maintenanceDue} Vessel${maintenanceDue !== 1 ? 's' : ''}`, icon: <AlertCircle className="w-4 h-4 text-rose-500" /> },
          { label: 'Under Maintenance', val: `${underMaintenance} Vessel${underMaintenance !== 1 ? 's' : ''}`, icon: <Wrench className="w-4 h-4 text-amber-500" /> },
          { label: 'Completed Jobs', val: `${completedJobsCount} jobs`, icon: <Check className="w-4 h-4 text-emerald-500" /> },
          { label: 'Upcoming Inspections', val: `${upcomingInspections} Scheduled`, icon: <Calendar className="w-4 h-4 text-indigo-500" /> },
          { label: 'Compliance Status', val: `${compliancePercentage}% Valid`, icon: <ShieldCheck className="w-4 h-4 text-emerald-600" /> },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-premium flex flex-col justify-between gap-3 text-xs font-bold">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[8px] font-bold uppercase tracking-widest leading-none">{stat.label}</span>
              {stat.icon}
            </div>
            <span className="text-xs font-extrabold text-primary-deep">{stat.val}</span>
          </div>
        ))}
      </div>

      {/* Empty Fleet Zero State */}
      {activeFleet.length === 0 && !isLoadingFleet && (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-premium space-y-4 max-w-2xl mx-auto">
          <Anchor className="w-12 h-12 text-primary-light mx-auto" />
          <h3 className="font-heading text-lg font-bold text-primary-deep">No Houseboats in Fleet Yet</h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
            You currently have no registered houseboats in your fleet. Once you list a houseboat, its maintenance schedule, safety compliance audits, and service logs will automatically appear here.
          </p>
          <a
            href="/host/dashboard#houseboats"
            className="inline-flex items-center gap-2 bg-primary-deep hover:bg-primary-light text-white text-xs font-bold px-6 py-3 rounded-2xl shadow-md transition-all"
          >
            Register Houseboat <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      )}

      {/* Maintenance Grid Splitting */}
      {(activeFleet.length > 0 || maintenanceList.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Panel: Filter & Scheduled Jobs */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Filters Toolbar */}
            <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-premium flex gap-1.5 overflow-x-auto scrollbar-none">
              {[
                { label: 'All Jobs', key: 'all' },
                { label: 'Overdue Inspections', key: 'overdue' },
                { label: 'Under Repair', key: 'today' },
                { label: 'Scheduled Maintenance', key: 'upcoming' },
                { label: 'Completed History', key: 'completed' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setMaintenanceFilter(tab.key as any)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                    maintenanceFilter === tab.key
                      ? 'bg-primary-deep text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Jobs Feed Cards */}
            <div className="space-y-4">
              {filteredMaintenance.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-premium space-y-3">
                  <Wrench className="w-10 h-10 text-slate-300 mx-auto" />
                  <h3 className="font-heading text-sm font-bold text-slate-700">No Maintenance Records Found</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    All vessels in your fleet are in prime operational condition. Click Schedule Maintenance to add a new ticket.
                  </p>
                </div>
              ) : (
                filteredMaintenance.map((job) => (
                  <div key={job.id} className="bg-white rounded-3xl border border-slate-100 shadow-premium overflow-hidden flex flex-col sm:flex-row justify-between hover-lift">
                    
                    {/* Image panel thumbnail banner */}
                    <div className="relative aspect-[16/7] sm:w-44 sm:h-auto bg-slate-100 overflow-hidden shrink-0">
                      <img src={job.boatImage} alt={job.boatName} className="w-full h-full object-cover" />
                      <span className={`absolute top-3 left-3 text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-wider backdrop-blur-sm ${
                        job.priority === 'High' ? 'bg-rose-500/80 text-white' : 'bg-slate-600/80 text-white'
                      }`}>
                        {job.priority} Priority
                      </span>
                    </div>

                    {/* Body details */}
                    <div className="p-5 flex-1 flex flex-col justify-between gap-4 text-xs font-bold text-slate-700">
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold border-b border-slate-50 pb-1.5">
                          <span>Ref: {job.id}</span>
                          <span>Next due: {job.nextServiceDate}</span>
                        </div>

                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h4 className="font-heading text-slate-800 text-xs font-bold">{job.boatName}</h4>
                            <span className="text-[10px] text-primary-deep uppercase block">{job.type}</span>
                          </div>
                          <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${
                            job.status === 'Overdue' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                            job.status === 'Underway' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                            job.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            'bg-sky-50 text-sky-600 border-sky-100'
                          }`}>
                            {job.status}
                          </span>
                        </div>

                        <p className="text-[10px] text-slate-400 font-sans leading-relaxed font-semibold">
                          Assigned Technician: {job.technician} • Estimated cost: ₹{job.cost.toLocaleString('en-IN')}
                        </p>
                      </div>

                      {/* Actions footer */}
                      <div className="flex gap-2 justify-end border-t border-slate-50 pt-2 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setSelectedAuditJob(job)}
                          className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg font-bold cursor-pointer"
                        >
                          Audit Log
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteJob(job.id, job.boatName)}
                          className="bg-white hover:bg-rose-50 border border-slate-200 text-rose-500 hover:text-rose-700 px-2.5 py-1.5 rounded-lg font-bold cursor-pointer"
                          title="Delete Maintenance Ticket"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        {job.status !== 'Completed' && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setRescheduleJob(job);
                                setNewRescheduleDate(job.nextServiceDate);
                              }}
                              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg font-bold cursor-pointer"
                            >
                              Reschedule
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMarkMaintenanceCompleted(job.id)}
                              className="bg-primary-deep hover:bg-primary-light text-white px-4 py-1.5 rounded-lg font-bold cursor-pointer shadow-sm"
                            >
                              Complete Job
                            </button>
                          </>
                        )}
                      </div>

                    </div>

                  </div>
                ))
              )}
            </div>

          </div>

          {/* Right Panel: Safety Compliance checklist widgets */}
          <div className="lg:col-span-4 space-y-6">
            
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-premium space-y-4">
              <div className="border-b border-slate-50 pb-2 flex justify-between items-center">
                <h3 className="font-heading text-xs font-bold text-slate-400 uppercase tracking-wider">Vessel Port Safety Compliance</h3>
                <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  {compliancePercentage}% Valid
                </span>
              </div>

              <div className="space-y-3.5 text-xs font-bold text-slate-700">
                {[
                  { key: 'lifeJackets', label: '100% Life Jackets compliance audit' },
                  { key: 'fireExtinguisher', label: 'Hydrostatic pressure fire extinguisher checks' },
                  { key: 'emergencyKit', label: 'Paramedic trauma first-aid box verification' },
                  { key: 'pollutionCert', label: 'Vessel exhaust emissions pollution certificates' },
                  { key: 'portInspection', label: 'Port Authority physical hull inspection clearance' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => toggleComplianceItem(item.key)}
                    className="w-full text-left flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="shrink-0 mt-0.5">
                      {complianceList[item.key] ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-600 leading-normal">
                      <span className="text-slate-800 font-bold block">{item.label}</span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">
                        {complianceList[item.key] ? 'Audit Status: PASSED & VALID' : 'Audit Status: EXPIRED/PENDING'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Modal 1: Schedule Maintenance Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-heading text-base font-bold text-primary-deep flex items-center gap-2">
                <Wrench className="w-4 h-4 text-secondary-emerald" /> Schedule Maintenance Ticket
              </h3>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-600 uppercase text-[9px] font-bold mb-1">Select Houseboat *</label>
                <select
                  value={newJob.boatId}
                  onChange={(e) => setNewJob({ ...newJob, boatId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-bold outline-none focus:border-secondary-emerald"
                  required
                >
                  <option value="" disabled>-- Select Vessel from Fleet --</option>
                  {activeFleet.map((boat) => (
                    <option key={boat.id} value={boat.id}>
                      {boat.name} ({boat.category || 'Luxury'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 uppercase text-[9px] font-bold mb-1">Task Type *</label>
                  <select
                    value={newJob.type}
                    onChange={(e) => setNewJob({ ...newJob, type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-bold outline-none focus:border-secondary-emerald"
                  >
                    <option value="Engine Service & Oil Change">Engine Service & Oil Change</option>
                    <option value="Port Safety & Hull Inspection">Port Safety & Hull Inspection</option>
                    <option value="AC & Generator Overhaul">AC & Generator Overhaul</option>
                    <option value="Plumbing & Water Filter">Plumbing & Water Filter</option>
                    <option value="Interior Deep Clean">Interior Deep Clean</option>
                    <option value="Safety Equipment Audit">Safety Equipment Audit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 uppercase text-[9px] font-bold mb-1">Service Date *</label>
                  <input
                    type="date"
                    value={newJob.nextServiceDate}
                    onChange={(e) => setNewJob({ ...newJob, nextServiceDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-bold outline-none focus:border-secondary-emerald"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 uppercase text-[9px] font-bold mb-1">Assigned Technician</label>
                  <input
                    type="text"
                    placeholder={`e.g. Capt. ${user?.name || 'Chief Engineer'}`}
                    value={newJob.technician}
                    onChange={(e) => setNewJob({ ...newJob, technician: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-bold outline-none focus:border-secondary-emerald"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 uppercase text-[9px] font-bold mb-1">Priority Level</label>
                  <select
                    value={newJob.priority}
                    onChange={(e) => setNewJob({ ...newJob, priority: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-bold outline-none focus:border-secondary-emerald"
                  >
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 uppercase text-[9px] font-bold mb-1">Estimated Cost (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 15000"
                  value={newJob.cost}
                  onChange={(e) => setNewJob({ ...newJob, cost: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-bold outline-none focus:border-secondary-emerald"
                />
              </div>

              <div>
                <label className="block text-slate-600 uppercase text-[9px] font-bold mb-1">Audit Notes / Requirements</label>
                <textarea
                  rows={2}
                  placeholder="Details about spare parts required or inspection notes..."
                  value={newJob.notes}
                  onChange={(e) => setNewJob({ ...newJob, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-bold outline-none focus:border-secondary-emerald resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-secondary-emerald hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  Save Maintenance Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Reschedule Job Modal */}
      {rescheduleJob && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-heading text-sm font-bold text-primary-deep flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" /> Reschedule {rescheduleJob.type}
              </h3>
              <button
                type="button"
                onClick={() => setRescheduleJob(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Updating scheduled date for vessel <span className="font-bold text-slate-800">{rescheduleJob.boatName}</span>.
            </p>

            <form onSubmit={handleConfirmReschedule} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-600 uppercase text-[9px] font-bold mb-1">New Service Date *</label>
                <input
                  type="date"
                  value={newRescheduleDate}
                  onChange={(e) => setNewRescheduleDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-bold outline-none focus:border-secondary-emerald"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRescheduleJob(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary-deep hover:bg-primary-light text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  Confirm Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Audit Log Modal */}
      {selectedAuditJob && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-heading text-sm font-bold text-primary-deep flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary-light" /> Diagnostic Audit Log — {selectedAuditJob.id}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedAuditJob(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-semibold">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                <img src={selectedAuditJob.boatImage} alt={selectedAuditJob.boatName} className="w-14 h-14 rounded-xl object-cover" />
                <div>
                  <h4 className="font-heading font-bold text-slate-900">{selectedAuditJob.boatName}</h4>
                  <span className="text-[10px] text-primary-deep font-bold block">{selectedAuditJob.type}</span>
                  <span className="text-[9px] text-slate-400 block">Assigned: {selectedAuditJob.technician}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-bold block">Job Status</span>
                  <span className="font-bold text-emerald-600 uppercase text-[10px]">{selectedAuditJob.status}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-bold block">Estimated Cost</span>
                  <span className="font-extrabold text-slate-900">₹{selectedAuditJob.cost.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-bold block">Next Service Due</span>
                  <span className="font-bold text-slate-900">{selectedAuditJob.nextServiceDate}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-bold block">Priority Level</span>
                  <span className="font-bold text-rose-600 text-[10px] uppercase">{selectedAuditJob.priority}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Technical Audit Notes</span>
                <p className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 text-xs leading-relaxed italic">
                  "{selectedAuditJob.notes || 'Routine diagnostic and preventive maintenance checklist passed.'}"
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedAuditJob(null)}
                className="w-full py-2.5 bg-primary-deep hover:bg-primary-light text-white font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
              >
                Close Audit Log
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
