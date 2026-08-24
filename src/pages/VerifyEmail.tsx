import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { CheckCircle2, XCircle, Loader2, ArrowRight, Compass } from 'lucide-react';

export const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setLoading(false);
        setSuccess(false);
        setMessage('Verification token is missing. Please check your email link.');
        return;
      }

      try {
        const response = await api.post(`/auth/verify-email/${token}`);
        setSuccess(true);
        setMessage(response.data.message || 'Email verified successfully!');
      } catch (err: any) {
        setSuccess(false);
        setMessage(err.response?.data?.message || 'Email verification failed. The link may have expired.');
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-premium p-8 text-center space-y-6">
        
        {loading ? (
          <div className="space-y-4 py-8">
            <Loader2 className="w-10 h-10 animate-spin text-secondary-emerald mx-auto" />
            <div>
              <h2 className="font-heading text-lg font-bold text-primary-deep">Verifying your email</h2>
              <p className="text-xs text-slate-400 font-semibold font-sans mt-1">Please wait while we secure your partner account...</p>
            </div>
          </div>
        ) : success ? (
          <div className="space-y-5 animate-in zoom-in-95 duration-250">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-secondary-emerald flex items-center justify-center mx-auto border border-emerald-100">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            
            <div className="space-y-2">
              <h1 className="font-heading text-xl font-extrabold text-primary-deep">Email Verified!</h1>
              <p className="text-xs text-slate-500 leading-relaxed font-sans px-2">
                {message}
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100/60 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Verification Badge Active 🟢
            </div>

            <Link
              to="/login"
              className="w-full py-3.5 bg-primary-deep hover:bg-primary-light text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all"
            >
              Sign In to Your Workspace <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-5 animate-in zoom-in-95 duration-250">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <XCircle className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h1 className="font-heading text-xl font-extrabold text-primary-deep">Verification Failed</h1>
              <p className="text-xs text-slate-500 leading-relaxed font-sans px-2">
                {message}
              </p>
            </div>

            <div className="pt-2">
              <Link
                to="/login"
                className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm block transition-all"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-slate-50 text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
          <Compass className="w-3.5 h-3.5 text-accent-gold" /> b4boat Partner Portal
        </div>

      </div>
    </div>
  );
};

export default VerifyEmail;
