import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Loader2, KeyRound, Eye, EyeOff } from 'lucide-react';

const resetPasswordSchema = zod.object({
  password: zod.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'Password must contain uppercase, lowercase, number, and special character (@$!%*?&)'),
  confirmPassword: zod.string().min(1, 'Please confirm your password'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

type ResetPasswordFormInputs = zod.infer<typeof resetPasswordSchema>;

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormInputs>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormInputs) => {
    if (!token) {
      toast.error('Reset token is missing. Please request a new link.');
      return;
    }
    
    setIsSubmitting(true);
    const loadingToast = toast.loading('Updating your password...');
    try {
      const response = await api.post(`/auth/reset-password/${token}`, {
        password: data.password,
        confirmPassword: data.confirmPassword,
      });

      toast.dismiss(loadingToast);
      toast.success(response.data.message || 'Password reset successfully!');
      
      // Redirect to login
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err: any) {
      toast.dismiss(loadingToast);
      const errMsg = err.response?.data?.message || 'Failed to reset password. The link may have expired.';
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-premium p-8 space-y-6">
        
        <div className="space-y-2">
          <div className="w-11 h-11 rounded-2xl bg-secondary-emerald/10 text-secondary-emerald border border-secondary-emerald/20 flex items-center justify-center mb-3">
            <KeyRound className="w-5 h-5" />
          </div>
          <h1 className="font-heading text-xl font-extrabold text-primary-deep">
            Set your new password
          </h1>
          <p className="text-xs text-slate-400 font-semibold font-sans">
            Please choose a strong, unique password with at least 8 characters.
          </p>
        </div>

        {!token ? (
          <div className="bg-rose-50 text-rose-600 rounded-2xl p-4 text-xs font-semibold leading-relaxed border border-rose-100">
            ⚠️ The password reset token is invalid or missing. Please return to the login page and click "Forgot Password" to generate a new reset request link.
            <div className="mt-4">
              <Link to="/login" className="px-4 py-2 bg-rose-600 text-white rounded-xl font-bold uppercase tracking-wider text-[10px]">
                Back to Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Password */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary-emerald/20 focus:border-secondary-emerald shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[10px] text-rose-500 font-bold mt-1.5 font-sans leading-relaxed">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Confirm New Password</label>
              <input
                type="password"
                {...register('confirmPassword')}
                placeholder="••••••••"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary-emerald/20 focus:border-secondary-emerald shadow-sm"
              />
              {errors.confirmPassword && (
                <p className="text-[10px] text-rose-500 font-bold mt-1.5 font-sans">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-primary-deep hover:bg-primary-light text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Updating...
                </>
              ) : (
                'Reset Password'
              )}
            </button>

          </form>
        )}

      </div>
    </div>
  );
};

export default ResetPassword;
