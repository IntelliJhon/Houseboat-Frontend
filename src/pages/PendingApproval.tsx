import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, LogOut, Loader2, Compass, AlertCircle } from 'lucide-react';

export const PendingApproval: React.FC = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleCheckStatus = async () => {
    setChecking(true);
    await refreshUser();
    setChecking(false);
  };

  // If active, redirect immediately
  React.useEffect(() => {
    if (user && user.status === 'ACTIVE') {
      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (user.role === 'HOST') {
        navigate('/host/register');
      } else {
        navigate('/');
      }
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-premium p-8 text-center space-y-6">
        
        {user?.status === 'REJECTED' ? (
          <div className="space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h1 className="font-heading text-xl font-extrabold text-primary-deep">Application Rejected</h1>
              <p className="text-xs text-slate-500 leading-relaxed font-sans px-2">
                Your partner workspace registration request was rejected by the administrator.
              </p>
            </div>

            <div className="bg-rose-50 border border-rose-100/60 rounded-2xl p-4 text-left space-y-1">
              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">Rejection Reason:</span>
              <p className="text-[11px] text-rose-700 leading-normal font-sans">
                The business licensing documentation provided (GSTIN registration certificate) could not be verified against the official governmental registry. Please register again with valid documents.
              </p>
            </div>
          </div>
        ) : user?.status === 'SUSPENDED' ? (
          <div className="space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 border border-amber-100 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h1 className="font-heading text-xl font-extrabold text-primary-deep">Account Suspended</h1>
              <p className="text-xs text-slate-500 leading-relaxed font-sans px-2">
                Your partner operator account has been temporarily suspended by the b4boat compliance audit team.
              </p>
            </div>

            <div className="bg-amber-50/50 border border-amber-100/60 rounded-2xl p-4 text-left space-y-1">
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Compliance Notice:</span>
              <p className="text-[11px] text-amber-700 leading-normal font-sans">
                A review of safety certificate updates for your houseboats is required. Please check your email inbox for compliance next steps, or contact support desk.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 border border-amber-100 flex items-center justify-center mx-auto">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
            </div>

            <div className="space-y-2">
              <h1 className="font-heading text-xl font-extrabold text-primary-deep">Pending Admin Approval</h1>
              <p className="text-xs text-slate-500 leading-relaxed font-sans px-2">
                Thank you for verifying your email! Your operator registration details are currently being audited by our onboarding team.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Awaiting Document Audit ⏳
            </div>

            <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
              We typically complete partner validations within 24 hours. You will receive an email confirmation once unlocked.
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={checking}
            className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Check Status'}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-slate-400" /> Log Out
          </button>
        </div>

        <div className="pt-4 border-t border-slate-50 text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
          <Compass className="w-3.5 h-3.5 text-accent-gold" /> b4boat Partner Portal
        </div>

      </div>
    </div>
  );
};

export default PendingApproval;
