'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';

type Session = {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  expires: string;
} | null;

type MainNavProps = {
  session?: Session;
};

export function MainNav({ session }: MainNavProps = {}) {
  const pathname = usePathname() || '';

  if (pathname.startsWith('/api/auth')) {
    return null;
  }
  
  const handleSignOut = () => {
    import('@/lib/auth').then(({ signOut }) => signOut());
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Il Buco
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link 
                href="/" 
                className={`border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname === '/' ? 'border-indigo-500 text-gray-900' : ''
                }`}
              >
                Inicio
              </Link>
              {session && (
                <Link 
                  href="/analytics" 
                  className={`border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    pathname.startsWith('/analytics') ? 'border-indigo-500 text-gray-900' : ''
                  }`}
                >
                  Analytics
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center">
            {session ? (
              <Button 
                variant="outline" 
                onClick={handleSignOut}
                className="ml-4"
              >
                Cerrar sesión
              </Button>
            ) : (
              <Link href="/api/auth/signin">
                <Button variant="outline">Iniciar sesión</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
