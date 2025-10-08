'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

export default function RootRedirectPage() {
  const { user, autoLogin } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      await autoLogin();
      if (user) {
        router.replace('/dashboard/chat'); // si está logueado, va al chat
      } else {
        router.replace('/Home'); // si no, va a Home
      }
      setLoading(false);
    }
    checkAuth();
  }, [user, autoLogin, router]);

  if (loading) return <div>Cargando...</div>;
  return null;
}
