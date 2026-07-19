'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    // 1. If they are on the login page, let them stay
    if (pathname === '/login') {
      setIsAllowed(true);
      return;
    }

    // 2. Check if they have the auth cookie
    const hasSession = document.cookie.includes('auth_session=');
    
    // 3. If no cookie, kick them to login
    if (!hasSession) {
      router.push('/login');
    } else {
      setIsAllowed(true);
    }
  }, [pathname, router]);

  // Show a loading spinner while checking
  if (isAllowed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // If allowed, show the app!
  return <>{children}</>;
}
