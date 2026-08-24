import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Loader2, ShieldCheck, TrendingUp, Anchor, Compass, Eye, EyeOff } from 'lucide-react';

const loginSchema = zod.object({
  email: zod.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: zod.string().min(1, 'Password is required'),
  rememberMe: zod.boolean().optional(),
});

type LoginFormInputs = zod.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const errorParam = searchParams.get('error');
  const sessionExpired = searchParams.get('session_expired');

  React.useEffect(() => {
    let hasChanged = false;
    if (errorParam === 'oauth_failed') {
      toast.error('Google authentication failed. Please try again.', {
        id: 'oauth_failed_toast'
      });
      searchParams.delete('error');
      hasChanged = true;
    }
    if (errorParam === 'unauthorized_admin') {
      toast.error('Access Denied: Only authorized administrators are permitted to enter the Control Panel.', {
        id: 'unauthorized_admin_toast',
        duration: 6000,
        style: {
          background: '#0F172A',
          color: '#F8FAFC',
          border: '1px solid #EF4444',
          fontSize: '12px',
          fontWeight: 'bold',
          padding: '12px 20px',
          borderRadius: '12px',
          boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.1), 0 4px 6px -4px rgba(239, 68, 68, 0.1)',
        },
        icon: '🚫',
      });
      searchParams.delete('error');
      hasChanged = true;
    }
    if (sessionExpired === 'true') {
      toast.error('Your session has expired. Please login again.', {
        id: 'session_expired_toast'
      });
      searchParams.delete('session_expired');
      hasChanged = true;
    }
    if (hasChanged) {
      setSearchParams(searchParams, { replace: true });
    }
  }, [errorParam, sessionExpired, searchParams, setSearchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false,
    }
  });

  const onSubmit = async (data: LoginFormInputs) => {
    setIsSubmitting(true);
    const loadingToast = toast.loading('Authenticating your credentials...');
    try {
      const response = await api.post('/auth/login', {
        email: data.email,
        password: data.password,
      });

      toast.dismiss(loadingToast);
      toast.success(response.data.message || 'Login successful!');
      
      const { accessToken, user } = response.data.data;
      login(accessToken, user);

      const redirectParam = searchParams.get('redirect');
      if (redirectParam) {
        navigate(redirectParam);
      } else if (user.role === 'ADMIN') {
        navigate('/admin');
      } else if (user.role === 'HOST') {
        navigate('/host/dashboard');
      } else {
        navigate('/');
      }


    } catch (err: any) {
      toast.dismiss(loadingToast);
      const errMsg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    const roleParam = searchParams.get('role') || 'CUSTOMER';
    const redirectParam = searchParams.get('redirect') || '';
    window.location.href = `http://localhost:5000/api/auth/google?role=${roleParam}&redirect=${encodeURIComponent(redirectParam)}`;
  };

  const roleParam = searchParams.get('role') || 'CUSTOMER';

  const contentMap = {
    CUSTOMER: {
      leftLogoBadge: 'Guest',
      leftHeading: 'Discover Kerala\'s most premium houseboat cruises.',
      leftSubtitle: 'Handpicked verified luxury cruises across Alleppey, Kumarakom, and Kollam backwaters.',
      features: [
        { title: 'Verified Luxury Vessels', desc: 'Pre-inspected safety compliance, premium crew service, and pristine hygiene.', icon: <Anchor className="w-5 h-5 text-secondary-emerald" /> },
        { title: 'Real-Time Direct Booking', desc: 'Secure checkout with instant digital boarding passes and direct check-ins.', icon: <TrendingUp className="w-5 h-5 text-accent-gold" /> },
        { title: 'Local Dockside Concierge', desc: 'Dedicated assistance at Punnamada and Kumarakom ports for smooth check-ins.', icon: <ShieldCheck className="w-5 h-5 text-emerald-500" /> },
      ],
      rightHeading: 'Sign in to b4boat',
      rightSubtitle: 'Enter your credentials to book and manage your houseboat stays.',
      placeholderEmail: 'yourname@example.com',
      showHostSignup: false,
    },
    ADMIN: {
      leftLogoBadge: 'Admin',
      leftHeading: 'Secure governance for the houseboat booking registry.',
      leftSubtitle: 'Platform administration, licensing audits, transaction ledger tracking, and support systems.',
      features: [
        { title: 'Compliance & Safety Audits', desc: 'Verify host registration requests, safety licensing, and pollution clearances.', icon: <ShieldCheck className="w-5 h-5 text-secondary-emerald" /> },
        { title: 'Ledger & Transaction Logs', desc: 'Monitor commissions, secure merchant payouts, refunds, and booking ledgers.', icon: <TrendingUp className="w-5 h-5 text-accent-gold" /> },
        { title: 'Portal Management Hub', desc: 'Oversee listed vessels, active operators, and resolve passenger disputes.', icon: <Anchor className="w-5 h-5 text-emerald-500" /> },
      ],
      rightHeading: 'Control Panel Workspace',
      rightSubtitle: 'Enter your administrator security credentials to access.',
      placeholderEmail: 'admin@b4boat.com',
      showHostSignup: false,
    },
    HOST: {
      leftLogoBadge: 'Partner',
      leftHeading: 'Manage your backwater fleet from one premium workspace.',
      leftSubtitle: 'Join Kerala\'s fastest-growing luxury houseboat booking network.',
      features: [
        { title: 'Trusted by Kerala Houseboat Owners', desc: 'Secure booking systems designed specifically for backwater operators.', icon: <Anchor className="w-5 h-5 text-secondary-emerald" /> },
        { title: 'Full Revenue Analytics', desc: 'Monitor your payout status, platform commissions, and historical records.', icon: <TrendingUp className="w-5 h-5 text-accent-gold" /> },
        { title: 'Compliance & Verification', desc: 'Verify safety documents, pollution clearance audits, and passenger capacity.', icon: <ShieldCheck className="w-5 h-5 text-emerald-500" /> },
      ],
      rightHeading: 'Sign in to Partner Workspace',
      rightSubtitle: 'Enter your credentials or register a new host partner account.',
      placeholderEmail: 'you@houseboatcompany.com',
      showHostSignup: true,
    }
  };

  const content = contentMap[roleParam as keyof typeof contentMap] || contentMap.HOST;

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white font-sans text-slate-800 antialiased animate-in fade-in duration-300">
      
      {/* LEFT SIDE: Luxury Branding & Features */}
      <div className="hidden lg:flex lg:col-span-5 relative overflow-hidden bg-primary-deep text-white flex-col justify-between p-12">
        {/* Background Image Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=800&q=80" 
            alt="Kerala Houseboat Backwaters" 
            className="w-full h-full object-cover opacity-35 filter brightness-90 saturate-100"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-slate-900/10" />
        </div>

        {/* Header Branding */}
        <div className="relative z-10">
          <span className="font-heading text-2xl font-extrabold tracking-tight flex items-center">
            <span className="text-white">b4</span>
            <span className="text-secondary-emerald">boat</span>
            <span className="text-accent-gold text-[10px] font-bold ml-1.5 px-2 py-0.5 rounded bg-white/10 uppercase tracking-widest">{content.leftLogoBadge}</span>
          </span>
        </div>

        {/* Marketing Tagline & Features */}
        <div className="relative z-10 space-y-8 my-auto">
          <div className="space-y-3">
            <h2 className="font-heading text-3xl font-extrabold leading-tight">
              {content.leftHeading}
            </h2>
            <p className="text-slate-300 text-xs font-semibold font-sans">
              {content.leftSubtitle}
            </p>
          </div>

          <div className="space-y-4">
            {content.features.map((f, i) => (
              <div key={i} className="flex gap-3 bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <span className="shrink-0 mt-0.5">{f.icon}</span>
                <div>
                  <h4 className="text-xs font-bold text-white">{f.title}</h4>
                  <p className="text-[10px] text-slate-300 font-semibold mt-1 font-sans leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2">
          <Compass className="w-4 h-4 text-accent-gold" /> © 2026 b4boat Technologies Private Limited.
        </div>
      </div>

      {/* RIGHT SIDE: Auth Form */}
      <div className="col-span-1 lg:col-span-7 flex flex-col justify-center px-6 sm:px-16 lg:px-24 py-12">
        <div className="max-w-md w-full mx-auto space-y-8">
          
          <div className="space-y-2">
            <h1 className="font-heading text-2xl font-extrabold text-primary-deep">
              {content.rightHeading}
            </h1>
            <p className="text-xs text-slate-400 font-semibold font-sans">
              {content.rightSubtitle}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
              <input
                type="email"
                {...register('email')}
                placeholder={content.placeholderEmail}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary-emerald/20 focus:border-secondary-emerald shadow-sm transition-all"
              />
              {errors.email && (
                <p className="text-[10px] text-rose-500 font-bold mt-1.5 font-sans">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
                <Link 
                  to="/forgot-password" 
                  className="text-[10px] font-bold text-secondary-emerald hover:text-primary-deep transition-all"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="••••••••••••"
                  className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary-emerald/20 focus:border-secondary-emerald shadow-sm transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[10px] text-rose-500 font-bold mt-1.5 font-sans">{errors.password.message}</p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('rememberMe')}
                  className="w-4 h-4 text-secondary-emerald border-slate-200 rounded focus:ring-secondary-emerald/20"
                />
                <span>Remember me for 30 days</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-primary-deep hover:bg-primary-light text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">or</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* OAuth Google button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full py-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-sm hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-2.5"
          >
            {/* Google G Logo SVG */}
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5.04c1.64 0 3.12.56 4.28 1.67l3.2-3.2C17.52 1.58 14.94 1 12 1 7.35 1 3.37 3.68 1.48 7.58l3.76 2.92C6.12 7.55 8.84 5.04 12 5.04z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.28 1.47-1.11 2.72-2.36 3.56l3.66 2.84c2.14-1.98 3.73-4.89 3.73-8.55z"
              />
              <path
                fill="#FBBC05"
                d="M5.24 14.78A7.16 7.16 0 0 1 4.8 12c0-.98.17-1.92.47-2.78L1.48 6.3a11.96 11.96 0 0 0 0 11.4l3.76-2.92z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.1.74-2.51 1.18-4.3 1.18-3.16 0-5.88-2.51-6.76-5.46L1.48 15.9A11.96 11.96 0 0 0 12 23z"
              />
            </svg>
            Continue with Google
          </button>

          {/* Register Redirect */}
          {content.showHostSignup && (
            <p className="text-center text-xs font-semibold text-slate-500 font-sans">
              New to our platform?{' '}
              <Link 
                to="/register" 
                className="text-secondary-emerald hover:text-primary-deep font-bold transition-colors"
              >
                Create an account
              </Link>
            </p>
          )}

          {!content.showHostSignup && roleParam === 'CUSTOMER' && (
            <p className="text-center text-xs font-semibold text-slate-400 font-sans">
              Guests can log in instantly using <span className="font-bold">Continue with Google</span>.
            </p>
          )}

        </div>
      </div>

    </div>
  );
};

export default Login;
