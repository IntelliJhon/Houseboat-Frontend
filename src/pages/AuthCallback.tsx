import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { User } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

import api from '../services/api';

export const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const processCallback = async () => {
      const token = searchParams.get('token');
      const role = searchParams.get('role') as User['role'];
      const status = searchParams.get('status') as User['status'];
      const hasProfile = searchParams.get('hasProfile') === 'true';
      const redirectPath = searchParams.get('redirect');
      const nameParam = searchParams.get('name') || '';
      const emailParam = searchParams.get('email') || '';

      if (!token) {
        toast.error('Google Authentication failed. Missing token parameters.');
        navigate('/login');
        return;
      }

      localStorage.setItem('token', token);

      let realUser: User = {
        id: 'google-oauth-user',
        uuid: 'google-oauth-user-uuid',
        email: emailParam,
        name: nameParam,
        firstName: nameParam.split(' ')[0] || '',
        lastName: nameParam.split(' ').slice(1).join(' ') || '',
        role: role || 'CUSTOMER',
        status: status || 'ACTIVE',
        hasProfile,
      };

      try {
        const res = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data?.data?.user) {
          realUser = res.data.data.user;
        }
      } catch (err) {
        console.warn('Could not fetch /auth/me during callback:', err);
      }

      login(token, realUser);
      toast.success('Successfully authenticated with Google!', {
        id: 'oauth_success_toast'
      });

      if (redirectPath) {
        navigate(redirectPath);
      } else if (realUser.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (realUser.role === 'HOST') {
        if (hasProfile || realUser.status === 'ACTIVE') {
          navigate('/host/dashboard');
        } else {
          navigate('/host/register');
        }
      } else {
        navigate('/');
      }
    };

    processCallback();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
      <div className="text-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-secondary-emerald mx-auto" />
        <div>
          <h2 className="font-heading text-lg font-bold text-primary-deep">Securing OAuth Session</h2>
          <p className="text-xs text-slate-400 font-semibold font-sans mt-1">Please wait while we log you into the partner platform...</p>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
