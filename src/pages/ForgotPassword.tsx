import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Loader2, ArrowLeft, KeyRound, CheckCircle2, ShieldCheck, Lock } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const [step, setStep] = useState<'verify' | 'reset' | 'success'>('verify');
  
  const [emailInput, setEmailInput] = useState('');
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [verifiedName, setVerifiedName] = useState('');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Step 1: Verify Host Registered Email
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim().toLowerCase();

    if (!cleanEmail) {
      toast.error('Please enter your registered email address.', { id: 'err-email-req' });
      return;
    }

    setIsVerifying(true);
    const toastId = toast.loading('Verifying host email account...');

    try {
      const res = await api.post('/auth/verify-reset-email', { email: cleanEmail });
      toast.dismiss(toastId);
      toast.success(res.data.message || 'Email verified! Please enter your new password.', { id: 'v-success' });
      setVerifiedEmail(res.data?.data?.email || cleanEmail);
      setVerifiedName(res.data?.data?.name || '');
      setStep('reset');
    } catch (err: any) {
      toast.dismiss(toastId);
      const errMsg = err.response?.data?.message || 'No partner account found with this email address.';
      toast.error(errMsg, { id: 'v-err' });
    } finally {
      setIsVerifying(false);
    }
  };

  // Step 2: Direct Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long.', { id: 'err-pass-len' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation password do not match.', { id: 'err-pass-match' });
      return;
    }

    setIsResetting(true);
    const toastId = toast.loading('Updating password...');

    try {
      await api.post('/auth/direct-reset-password', {
        email: verifiedEmail,
        newPassword,
      });
      toast.dismiss(toastId);
      toast.success('Password updated successfully!', { id: 'reset-success' });
      setStep('success');
    } catch (err: any) {
      toast.dismiss(toastId);
      const errMsg = err.response?.data?.message || 'Failed to update password. Please try again.';
      toast.error(errMsg, { id: 'reset-err' });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-premium p-8 space-y-6">
        
        {/* Back Link */}
        <Link 
          to="/login" 
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
        </Link>

        {/* STEP 1: VERIFY EMAIL */}
        {step === 'verify' && (
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-500 border border-amber-100 flex items-center justify-center mb-3">
                <KeyRound className="w-5 h-5" />
              </div>
              <h1 className="font-heading text-xl font-extrabold text-primary-deep">
                Reset your password
              </h1>
              <p className="text-xs text-slate-400 font-semibold font-sans">
                Enter your registered partner email address below to change your password directly.
              </p>
            </div>

            <form onSubmit={handleVerifyEmail} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Registered Email Address *</label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="you@houseboatcompany.com"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary-emerald/20 focus:border-secondary-emerald shadow-sm"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-3.5 bg-primary-deep hover:bg-primary-light text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Verifying Email...
                  </>
                ) : (
                  'Verify & Continue'
                )}
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: ENTER NEW PASSWORD */}
        {step === 'reset' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="space-y-2">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-secondary-emerald border border-emerald-100 flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h1 className="font-heading text-xl font-extrabold text-primary-deep">
                Create New Password
              </h1>
              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 flex items-center gap-2 text-xs text-slate-600 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="truncate">
                  Account verified: <strong className="text-slate-800">{verifiedName ? `${verifiedName} (${verifiedEmail})` : verifiedEmail}</strong>
                </span>
              </div>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">New Password (Min 8 Characters) *</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary-emerald/20 focus:border-secondary-emerald shadow-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Confirm New Password *</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary-emerald/20 focus:border-secondary-emerald shadow-sm"
                  required
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('verify')}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="flex-1 py-3.5 bg-primary-deep hover:bg-primary-light text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isResetting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Updating...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" /> Reset Password Now
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3: SUCCESS */}
        {step === 'success' && (
          <div className="text-center space-y-4 py-4 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-secondary-emerald flex items-center justify-center mx-auto border border-emerald-100 shadow-xs">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h2 className="font-heading text-xl font-extrabold text-primary-deep">Password Updated!</h2>
              <p className="text-xs text-slate-500 font-semibold font-sans px-4">
                Your password has been changed successfully. You can now log in using your new credentials.
              </p>
            </div>
            <Link
              to="/login"
              className="mt-6 inline-block w-full py-3.5 bg-primary-deep hover:bg-primary-light text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all text-center cursor-pointer"
            >
              Return to Sign In
            </Link>
          </div>
        )}

      </div>
    </div>
  );
};

export default ForgotPassword;
