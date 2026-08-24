import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Loader2, ShieldCheck, Compass, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const registerSchema = zod.object({
  firstName: zod.string().min(1, 'First name is required').max(50, 'Cannot exceed 50 characters'),
  lastName: zod.string().min(1, 'Last name is required').max(50, 'Cannot exceed 50 characters'),
  email: zod.string().min(1, 'Email is required').email('Please enter a valid email address'),
  phone: zod.string().min(1, 'Phone number is required').regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number (e.g. +91 9876543210)'),
  password: zod.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'Password must contain uppercase, lowercase, number, and special character (@$!%*?&)'),
  confirmPassword: zod.string().min(1, 'Please confirm your password'),
  acceptTerms: zod.boolean().refine(val => val === true, 'You must accept the terms & conditions'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

type RegisterFormInputs = zod.infer<typeof registerSchema>;

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // OTP Verification Modal States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(300); // 5 minutes
  const [resendCooldown, setResendCooldown] = useState(60); // 60 seconds
  const [resendDisabled, setResendDisabled] = useState(true);
  const [resendCount, setResendCount] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer Effect
  useEffect(() => {
    let interval: any;
    if (showOtpModal && timer > 0 && !verificationSuccess) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0 && showOtpModal && !verificationSuccess) {
      setVerificationError('Verification code expired. Please request a new one.');
    }
    return () => clearInterval(interval);
  }, [showOtpModal, timer, verificationSuccess]);

  // Resend Cooldown Effect
  useEffect(() => {
    let interval: any;
    if (showOtpModal && resendCooldown > 0 && !verificationSuccess) {
      interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    } else if (resendCooldown === 0 && showOtpModal && !verificationSuccess) {
      setResendDisabled(false);
    }
    return () => clearInterval(interval);
  }, [showOtpModal, resendCooldown, verificationSuccess]);

  // Auto-focus first input on modal open
  useEffect(() => {
    if (showOtpModal && inputRefs.current[0]) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [showOtpModal]);

  const handleOtpChange = (index: number, value: string) => {
    if (value !== '' && !/^[0-9]$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);
    setVerificationError('');

    // Shift focus to next input if digit entered
    if (value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (otpDigits[index] === '' && index > 0) {
        const newDigits = [...otpDigits];
        newDigits[index - 1] = '';
        setOtpDigits(newDigits);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newDigits = [...otpDigits];
        newDigits[index] = '';
        setOtpDigits(newDigits);
      }
      setVerificationError('');
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtpDigits(digits);
      setVerificationError('');
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerifyOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const otp = otpDigits.join('');
    if (otp.length < 6) {
      setVerificationError('Please enter all 6 digits of the verification code.');
      return;
    }

    setIsVerifying(true);
    setVerificationError('');
    try {
      const response = await api.post('/v1/auth/verify-email', {
        email: otpEmail,
        otp,
      });

      setVerificationSuccess(true);
      toast.success('Registration Successful!');
      
      const { accessToken, user } = response.data.data;
      
      // Auto login
      setTimeout(() => {
        login(accessToken, user);
        navigate('/host/register');
      }, 1500);

    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Verification failed. Please check the code.';
      setVerificationError(errMsg);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCount >= 3) {
      setVerificationError('Maximum OTP resend limit reached. Please register again.');
      return;
    }

    setIsResending(true);
    setVerificationError('');
    try {
      await api.post('/v1/auth/resend-otp', {
        email: otpEmail,
      });
      
      toast.success('A new verification code has been sent!');
      setOtpDigits(['', '', '', '', '', '']);
      setTimer(300);
      setResendCooldown(60);
      setResendDisabled(true);
      setResendCount((prev) => prev + 1);
      
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Failed to resend code. Please try again.';
      setVerificationError(errMsg);
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormInputs>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      acceptTerms: false,
    }
  });

  const onSubmit = async (data: RegisterFormInputs) => {
    setIsSubmitting(true);
    const loadingToast = toast.loading('Registering partner account...');
    try {
      const response = await api.post('/v1/auth/register', {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });

      toast.dismiss(loadingToast);
      toast.success(response.data.message || 'Registration successful! Verification code sent.');
      
      // Save email for OTP and open OTP Modal
      setOtpEmail(data.email);
      setOtpDigits(['', '', '', '', '', '']);
      setTimer(300);
      setResendCooldown(60);
      setResendDisabled(true);
      setResendCount(0);
      setVerificationSuccess(false);
      setVerificationError('');
      setShowOtpModal(true);
      
    } catch (err: any) {
      toast.dismiss(loadingToast);
      const errMsg = err.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignup = () => {
    window.location.href = 'http://localhost:5000/api/auth/google?role=HOST';
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-50 font-sans text-slate-800 antialiased animate-in fade-in duration-300">
      
      {/* LEFT SIDE: Luxury Branding Panel */}
      <div className="hidden lg:flex lg:col-span-5 relative overflow-hidden bg-primary-deep text-white flex-col justify-between p-12">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1540553016722-983e48a2cd10?auto=format&fit=crop&w=800&q=80" 
            alt="Luxury Houseboat Sundeck" 
            className="w-full h-full object-cover opacity-30 filter brightness-95"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-slate-900/10" />
        </div>

        <div className="relative z-10">
          <span className="font-heading text-2xl font-extrabold tracking-tight flex items-center">
            <span className="text-white">b4</span>
            <span className="text-secondary-emerald">boat</span>
            <span className="text-accent-gold text-[10px] font-bold ml-1.5 px-2 py-0.5 rounded bg-white/10 uppercase tracking-widest">Partner</span>
          </span>
        </div>

        <div className="relative z-10 space-y-6 my-auto max-w-sm">
          <h2 className="font-heading text-3xl font-extrabold leading-tight">
            Unlock your fleet's true earning potential.
          </h2>
          <p className="text-slate-300 text-xs font-medium leading-relaxed font-sans">
            Connect directly with verified customers, manage calendars securely, and enjoy automated payments directly to your bank account.
          </p>
          <div className="flex items-center gap-2 text-xs font-bold text-secondary-emerald bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2.5 rounded-2xl">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Verifications verified by Kerala Tourism Authority</span>
          </div>
        </div>

        <div className="relative z-10 text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2">
          <Compass className="w-4 h-4 text-accent-gold" /> © 2026 b4boat Technologies Private Limited.
        </div>
      </div>

      {/* RIGHT SIDE: Register Form */}
      <div className="col-span-1 lg:col-span-7 flex flex-col justify-center px-6 sm:px-16 lg:px-24 py-12">
        <div className="max-w-md w-full mx-auto space-y-8">
          
          <div className="space-y-2">
            <h1 className="font-heading text-2xl font-extrabold text-primary-deep">
              Become a b4boat Host Partner
            </h1>
            <p className="text-xs text-slate-400 font-semibold font-sans">
              Enter your registration details. Verified partners will be reviewed within 24 hours.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            {/* First Name & Last Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">First Name</label>
                <input
                  type="text"
                  {...register('firstName')}
                  placeholder="e.g. Meera"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary-emerald/20 focus:border-secondary-emerald shadow-sm"
                />
                {errors.firstName && (
                  <p className="text-[10px] text-rose-500 font-bold mt-1 font-sans">{errors.firstName.message}</p>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Last Name</label>
                <input
                  type="text"
                  {...register('lastName')}
                  placeholder="e.g. Deshmukh"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary-emerald/20 focus:border-secondary-emerald shadow-sm"
                />
                {errors.lastName && (
                  <p className="text-[10px] text-rose-500 font-bold mt-1 font-sans">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
              <input
                type="email"
                {...register('email')}
                placeholder="you@houseboatcompany.com"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary-emerald/20 focus:border-secondary-emerald shadow-sm"
              />
              {errors.email && (
                <p className="text-[10px] text-rose-500 font-bold mt-1 font-sans">{errors.email.message}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Phone Number</label>
              <input
                type="text"
                {...register('phone')}
                placeholder="e.g. +91 98201 34567"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary-emerald/20 focus:border-secondary-emerald shadow-sm"
              />
              {errors.phone && (
                <p className="text-[10px] text-rose-500 font-bold mt-1 font-sans">{errors.phone.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary-emerald/20 focus:border-secondary-emerald shadow-sm"
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
                <p className="text-[10px] text-rose-500 font-bold mt-1 font-sans leading-relaxed">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Confirm Password</label>
              <input
                type="password"
                {...register('confirmPassword')}
                placeholder="••••••••"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary-emerald/20 focus:border-secondary-emerald shadow-sm"
              />
              {errors.confirmPassword && (
                <p className="text-[10px] text-rose-500 font-bold mt-1 font-sans">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Terms and Conditions */}
            <div className="py-1">
              <label className="flex items-start gap-2.5 text-xs font-semibold text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('acceptTerms')}
                  className="mt-0.5 w-4 h-4 text-secondary-emerald border-slate-200 rounded focus:ring-secondary-emerald/20"
                />
                <span className="leading-snug">
                  I accept the{' '}
                  <a href="#terms" className="text-secondary-emerald font-bold hover:underline">
                    Terms & Conditions
                  </a>{' '}
                  and b4boat's partner policies.
                </span>
              </label>
              {errors.acceptTerms && (
                <p className="text-[10px] text-rose-500 font-bold mt-1 font-sans">{errors.acceptTerms.message}</p>
              )}
            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-primary-deep hover:bg-primary-light text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Creating Account...
                </>
              ) : (
                'Register Partner Account'
              )}
            </button>

          </form>

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">or</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Google signup button */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            className="w-full py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-sm hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-2.5"
          >
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
            Sign up with Google
          </button>

          {/* Login Redirect */}
          <p className="text-center text-xs font-semibold text-slate-500 font-sans">
            Already registered?{' '}
            <Link 
              to="/login" 
              className="text-secondary-emerald hover:text-primary-deep font-bold transition-colors"
            >
              Sign In
            </Link>
          </p>

        </div>
      </div>

      {/* Premium OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md transition-all duration-300 animate-in fade-in p-3 sm:p-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-5 sm:p-8 max-w-md w-full mx-auto shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header border stripe */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-secondary-emerald to-emerald-400" />
            
            <div className="text-center space-y-3 sm:space-y-4">
              <div className="mx-auto w-11 h-11 sm:w-12 sm:h-12 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-secondary-emerald shadow-xs">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              
              <div>
                <h2 className="font-heading text-lg sm:text-xl font-extrabold text-primary-deep">Verify Your Email</h2>
                <p className="text-xs text-slate-400 font-semibold font-sans mt-1 leading-relaxed">
                  We've sent a 6-digit verification code to <span className="text-slate-800 font-bold block sm:inline break-all">{otpEmail}</span>
                </p>
              </div>
            </div>

            {verificationSuccess ? (
              /* Success Animation */
              <div className="my-6 sm:my-8 flex flex-col items-center justify-center space-y-3 py-4">
                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20 scale-in-center animate-in zoom-in duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-slate-800">Registration Successful</h3>
                <p className="text-[10px] text-slate-400 font-bold font-sans uppercase tracking-widest animate-pulse">Redirecting to Wizard...</p>
              </div>
            ) : (
              <form onSubmit={handleVerifyOTP} className="my-6 sm:my-8 space-y-5 sm:space-y-6">
                {/* 6 Input Boxes — Grid layout ensures 100% fluid scaling without overflow! */}
                <div className="grid grid-cols-6 gap-1.5 sm:gap-2.5">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      className="w-full h-11 sm:h-14 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl text-center text-base sm:text-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary-emerald/20 focus:border-secondary-emerald focus:bg-white shadow-xs transition-all"
                      autoFocus={index === 0}
                    />
                  ))}
                </div>

                {/* Error Banner */}
                {verificationError && (
                  <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-center animate-bounce">
                    <p className="text-[10px] text-rose-500 font-bold font-sans">{verificationError}</p>
                  </div>
                )}

                {/* Timer & Limits */}
                <div className="flex flex-col sm:flex-row sm:justify-between items-center text-xs font-semibold gap-1.5 text-center sm:text-left">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span>Code expires in: <span className={`font-bold font-sans ${timer < 60 ? 'text-rose-500' : 'text-slate-800'}`}>{formatTime(timer)}</span></span>
                  </div>
                  
                  {resendCount > 0 && (
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">
                      Resends: {resendCount}/3
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-2">
                  <button
                    type="submit"
                    disabled={isVerifying || timer === 0}
                    className="w-full py-3 sm:py-3.5 bg-secondary-emerald hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Verifying Code...
                      </>
                    ) : (
                      'Verify & Continue'
                    )}
                  </button>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left pt-1">
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={resendDisabled || isResending || resendCount >= 3}
                      className="text-xs font-bold text-secondary-emerald hover:text-primary-deep disabled:text-slate-400 transition-colors cursor-pointer"
                    >
                      {isResending ? (
                        <span className="flex items-center gap-1"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Resending...</span>
                      ) : resendDisabled ? (
                        `Resend OTP in ${resendCooldown}s`
                      ) : (
                        'Resend Verification Code'
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowOtpModal(false)}
                      className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      Change Email
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default Register;
