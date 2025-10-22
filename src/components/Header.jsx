'use client';

import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Header = () => {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // 🔹 Hide Header on /login page
  if (pathname === '/login') return null;

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/">
              <h1 className="text-xl cursor-pointer font-semibold">
                Hiring Manager Dashboard
              </h1>
            </Link>
            <p className="text-xs text-gray-500 mt-1">
              Powered by n8n Automation
            </p>
          </div>

          {status === 'authenticated' && session?.user && (
            <div className="flex items-center space-x-4">
              <p className="text-sm font-medium">{session.user.name}</p>
              <img
                src={session.user.image}
                alt="Profile"
                className="w-8 h-8 rounded-full"
              />
              <Button
                variant="outline"
                onClick={() => signOut({ callbackUrl: '/login' })}
              >
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
