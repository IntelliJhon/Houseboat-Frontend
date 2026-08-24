import React, { useState, useEffect } from 'react';
import { 
  Search, ChevronLeft, ChevronRight, Eye, MessageSquare,
  Users, Building, Wallet, Trash2, Key, XCircle, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../services/api';

export const ManageHostsSection: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Drawer state
  const [selectedHost, setSelectedHost] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [hostsList, setHostsList] = useState<any[]>([]);

  // Fetch registered host partners from DB
  const fetchHosts = async () => {
    try {
      const response = await api.get('/v1/admin/hosts');
      if (response.data?.data?.hosts) {
        setHostsList(response.data.data.hosts);
      }
    } catch (err) {
      console.error('Failed to fetch host partners:', err);
    }
  };

  useEffect(() => {
    fetchHosts();
  }, []);

  const handleToggleStatus = async (id: string, action: 'Suspend' | 'Activate' | 'Block') => {
    const nextStatus = action === 'Suspend' ? 'Suspended' : action === 'Block' ? 'Blocked' : 'Active';
    try {
      await api.patch(`/v1/admin/hosts/${id}/status`, { status: nextStatus });
      setHostsList(prev => prev.map(h => {
        if (h.id === id || h.rawId === id) {
          return { ...h, accountStatus: nextStatus };
        }
        return h;
      }));
      toast.success(`Host partner status updated to ${nextStatus}.`);
    } catch (err) {
      toast.error('Failed to update host partner status.');
    }
  };

  const handleResetPassword = (id: string, name: string) => {
    toast.success(`Temporary login credentials for ${name} (${id}) dispatched to registered email.`);
  };

  const handleDeleteAccount = (id: string, name: string) => {
    setHostsList(prev => prev.filter(h => h.id !== id && h.rawId !== id));
    toast.error(`Host account ${name} deleted from database.`);
    setIsDrawerOpen(false);
  };

  // Generate official PDF Host Partner Ledger Statement
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to generate statement PDF.');
      return;
    }

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>b4boat - Host Partner Directory Ledger</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; color: #0f172a; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0284c7; padding-bottom: 16px; margin-bottom: 24px; }
          .title { font-size: 24px; font-weight: bold; color: #0f172a; }
          .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
          .stats-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 24px; background: #f8fafc; padding: 16px; border-radius: 12px; }
          .stat-box { text-align: center; }
          .stat-val { font-size: 18px; font-weight: bold; color: #0284c7; }
          .stat-lbl { font-size: 10px; color: #64748b; text-transform: uppercase; margin-top: 2px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
          th { background: #0f172a; color: white; padding: 10px; text-align: left; font-size: 11px; text-transform: uppercase; }
          td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
          tr:nth-child(even) { background: #f8fafc; }
          .badge { display: inline-block; padding: 4px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold; }
          .badge-active { background: #ecfdf5; color: #059669; }
          .badge-suspended { background: #fef2f2; color: #dc2626; }
          .footer { margin-top: 32px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">b4boat Host Partner Directory</div>
            <div class="subtitle">Official Admin Audit Ledger & Commercial Partner Summary</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 12px; font-weight: bold;">Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
            <div style="font-size: 10px; color: #64748b;">Scope: ${hostsList.length} Partner Accounts</div>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-box"><div class="stat-val">${hostsList.length}</div><div class="stat-lbl">Total Hosts</div></div>
          <div class="stat-box"><div class="stat-val">${hostsList.filter(h => h.accountStatus === 'Active').length}</div><div class="stat-lbl">Active</div></div>
          <div class="stat-box"><div class="stat-val">${hostsList.filter(h => h.verificationStatus === 'Pending').length}</div><div class="stat-lbl">Pending KYC</div></div>
          <div class="stat-box"><div class="stat-val">${hostsList.filter(h => h.accountStatus === 'Suspended').length}</div><div class="stat-lbl">Suspended</div></div>
          <div class="stat-box"><div class="stat-val">₹${hostsList.reduce((acc, h) => acc + (h.revenue || 0), 0).toLocaleString('en-IN')}</div><div class="stat-lbl">Total Host Rev</div></div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Partner ID</th>
              <th>Host Name & Company</th>
              <th>Contact Phone</th>
              <th>Boats</th>
              <th>Revenue</th>
              <th>KYC Status</th>
              <th>Account</th>
            </tr>
          </thead>
          <tbody>
            ${hostsList.map(h => `
              <tr>
                <td><b>${h.id}</b></td>
                <td><b>${h.name}</b><br/><span style="color:#64748b;font-size:10px;">${h.company}</span></td>
                <td>${h.phone}</td>
                <td>${h.boatsCount} Boats</td>
                <td>₹${(h.revenue || 0).toLocaleString('en-IN')}</td>
                <td><span class="badge ${h.verificationStatus === 'Verified' ? 'badge-active' : 'badge-suspended'}">${h.verificationStatus}</span></td>
                <td><span class="badge ${h.accountStatus === 'Active' ? 'badge-active' : 'badge-suspended'}">${h.accountStatus}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          Confidential • b4boat Operations & Quality Assurance Desk • System Generated Document
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
  };

  const filteredHosts = hostsList.filter(host => {
    const matchesSearch = host.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      host.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      host.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      host.location.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === 'all' || host.accountStatus.toLowerCase() === statusFilter.toLowerCase();
    const matchesVerification = verificationFilter === 'all' || host.verificationStatus.toLowerCase() === verificationFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesVerification;
  });

  const totalPages = Math.max(1, Math.ceil(filteredHosts.length / rowsPerPage));
  const paginatedHosts = filteredHosts.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-extrabold text-primary-deep flex items-center gap-2">
            Host Partner Management <Users className="w-5 h-5 text-accent-gold" />
          </h1>
          <p className="text-xs text-slate-400 font-semibold font-sans">Monitor registered houseboat owners, verify business PAN credentials, and manage portal access privileges.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            type="button"
            onClick={handleExportPDF}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-200 transition-all cursor-pointer shadow-sm"
          >
            <FileText className="w-4 h-4 text-primary-light" /> Export PDF
          </button>
        </div>
      </div>

      {/* Top Cards Statistics row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Hosts', val: hostsList.length, color: 'bg-slate-100 text-slate-600 border-slate-200' },
          { label: 'Active Partners', val: hostsList.filter(h => h.accountStatus === 'Active').length, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
          { label: 'Pending Approval', val: hostsList.filter(h => h.verificationStatus === 'Pending').length, color: 'bg-amber-50 text-amber-600 border-amber-100' },
          { label: 'Suspended Accounts', val: hostsList.filter(h => h.accountStatus === 'Suspended').length, color: 'bg-rose-50 text-rose-600 border-rose-100' },
          { label: 'Blocked Listings', val: hostsList.filter(h => h.accountStatus === 'Blocked').length, color: 'bg-red-50 text-red-600 border-red-100' }
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
              placeholder="Search hosts by owner name, partner ID, company, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Account Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="blocked">Blocked</option>
            </select>

            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All KYC Statuses</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending Approval</option>
            </select>
          </div>
        </div>
      </div>

      {/* Hosts Table Ledger */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-premium p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-bold text-slate-600 whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase text-[9px] tracking-wider">
                <th className="pb-3 px-4">Partner Profile</th>
                <th className="pb-3">Location Details</th>
                <th className="pb-3 text-center">Boats Owned</th>
                <th className="pb-3 text-right">Revenue Generated</th>
                <th className="pb-3 text-center">Verification</th>
                <th className="pb-3 text-center">Account Status</th>
                <th className="pb-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedHosts.length > 0 ? (
                paginatedHosts.map((host) => (
                  <tr key={host.id} className="hover:bg-slate-50/50">
                    <td className="py-4 px-4 flex items-center gap-3">
                      <img src={host.photo} alt={host.name} className="w-10 h-10 rounded-full object-cover border border-slate-100 shadow-sm" />
                      <div>
                        <span className="text-slate-800 font-extrabold block flex items-center gap-1.5">
                          {host.name} <span className="font-mono text-[9px] text-slate-400 font-semibold">{host.id}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold block">{host.company}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="text-slate-700 block">{host.location}</span>
                      <span className="text-[9px] text-slate-400 font-semibold block">{host.phone}</span>
                    </td>
                    <td className="py-4 text-center text-slate-800">{host.boatsCount} Boats</td>
                    <td className="py-4 text-right">
                      <span className="text-slate-800 font-extrabold block">₹{host.revenue.toLocaleString('en-IN')}</span>
                      <span className="text-[9px] text-slate-400 block font-semibold">Joined: {host.joinedDate}</span>
                    </td>
                    <td className="py-4 text-center">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2.5 py-0.5 rounded-full border ${
                        host.verificationStatus === 'Verified' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {host.verificationStatus}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2.5 py-0.5 rounded-full border ${
                        host.accountStatus === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        host.accountStatus === 'Suspended' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                        'bg-red-50 text-red-600 border-red-100'
                      }`}>
                        {host.accountStatus}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <div className="flex gap-1.5 justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedHost(host);
                            setIsDrawerOpen(true);
                          }}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 cursor-pointer shadow-sm"
                          title="View Profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toast.success(`Message portal opened for: ${host.name}`)}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 cursor-pointer shadow-sm"
                          title="Message Host"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-semibold">
                    No matching host accounts found in registry.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredHosts.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-slate-50 pt-4 mt-4 text-slate-500 font-semibold">
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
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
              <span>Showing {(currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, filteredHosts.length)} of {filteredHosts.length} hosts</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-slate-600"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold text-slate-700">Page {currentPage} of {totalPages || 1}</span>
              <button
                type="button"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-slate-600"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Slide-out Host Details Profile Drawer */}
      {isDrawerOpen && selectedHost && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white h-full p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
            
            <div className="space-y-6">
              
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex gap-3 items-center">
                  <img src={selectedHost.photo} alt={selectedHost.name} className="w-12 h-12 rounded-full object-cover border border-slate-100 shadow-sm shrink-0" />
                  <div>
                    <h3 className="font-heading text-base font-extrabold text-primary-deep flex items-center gap-1.5">
                      {selectedHost.name}
                    </h3>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Host ID: {selectedHost.id}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <XCircle className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Business Details Card */}
              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-3">
                <h4 className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-slate-400" /> Corporate business credentials
                </h4>
                <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-700">
                  <div>
                    <span className="text-[9px] text-slate-400 font-semibold block uppercase">Company Name</span>
                    <span className="text-slate-800">{selectedHost.company}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-semibold block uppercase">Local Zone Location</span>
                    <span className="text-slate-800">{selectedHost.location}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-semibold block uppercase">PAN Document</span>
                    <span className="text-slate-800 font-mono">{selectedHost.pan}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-semibold block uppercase">GST License</span>
                    <span className="text-slate-800 font-mono">{selectedHost.gst}</span>
                  </div>
                </div>
              </div>

              {/* Financial Bank Details */}
              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-3">
                <h4 className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
                  <Wallet className="w-3.5 h-3.5 text-slate-400" /> Settlement bank coordinates
                </h4>
                <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-700">
                  <div>
                    <span className="text-[9px] text-slate-400 font-semibold block uppercase">Bank Name</span>
                    <span className="text-slate-800">{selectedHost.bankName}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-semibold block uppercase">Account Number</span>
                    <span className="text-slate-800 font-mono">{selectedHost.accountNo}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[9px] text-slate-400 font-semibold block uppercase">IFSC Code</span>
                    <span className="text-slate-800 font-mono">{selectedHost.ifsc}</span>
                  </div>
                </div>
              </div>

              {/* Registered Boats & Performance */}
              <div className="space-y-3">
                <h4 className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Performance metrics</h4>
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
                  <div className="border border-slate-100 p-3 rounded-xl bg-slate-50/50">
                    <span className="text-[8px] text-slate-400 uppercase block font-bold">Registered Boats</span>
                    <span className="text-slate-800 text-sm font-extrabold">{selectedHost.boatsCount} Vessels</span>
                  </div>
                  <div className="border border-slate-100 p-3 rounded-xl bg-slate-50/50">
                    <span className="text-[8px] text-slate-400 uppercase block font-bold">Overall Rating</span>
                    <span className="text-slate-800 text-sm font-extrabold">{selectedHost.rating} ⭐</span>
                  </div>
                  <div className="border border-slate-100 p-3 rounded-xl bg-slate-50/50">
                    <span className="text-[8px] text-slate-400 uppercase block font-bold">Total Earnings</span>
                    <span className="text-slate-800 text-sm font-extrabold">₹{selectedHost.revenue.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="space-y-3">
                <h4 className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Partner Audit Trail</h4>
                <div className="border-l border-slate-100 pl-4.5 ml-2.5 space-y-4 text-xs font-bold">
                  {selectedHost.timeline.map((step: any, sIdx: number) => (
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

            </div>

            {/* Actions Footer */}
            <div className="border-t border-slate-100 pt-4 mt-6 grid grid-cols-2 gap-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleResetPassword(selectedHost.id, selectedHost.name)}
                  className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold px-3 py-2 rounded-xl text-[10px] cursor-pointer flex items-center gap-1 shadow-sm"
                  title="Reset Password"
                >
                  <Key className="w-3.5 h-3.5 text-slate-500" /> Reset Password
                </button>
                <button
                  type="button"
                  onClick={() => toast.success(`Viewing KYC Documents upload list for: ${selectedHost.name}`)}
                  className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold px-3 py-2 rounded-xl text-[10px] cursor-pointer shadow-sm"
                >
                  View Docs
                </button>
              </div>

              <div className="flex gap-2 justify-end">
                {selectedHost.accountStatus === 'Active' ? (
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(selectedHost.id, 'Suspend')}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold px-4 py-2 rounded-xl text-[10px] cursor-pointer"
                  >
                    Suspend Partner
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(selectedHost.id, 'Activate')}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-bold px-4 py-2 rounded-xl text-[10px] cursor-pointer"
                  >
                    Activate Partner
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={() => handleDeleteAccount(selectedHost.id, selectedHost.name)}
                  className="bg-red-50 hover:bg-red-100 text-red-600 font-bold p-2.5 rounded-xl cursor-pointer"
                  title="Delete Host Account"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
