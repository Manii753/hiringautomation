'use client'

import { SessionProvider, useSession } from 'next-auth/react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

function AuthWrapper({ children }) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'unauthenticated' && pathname !== '/login') {
      router.push('/login');
    }
  }, [status, pathname, router]);

  return <>{children}</>;
}

export function Providers({ children }) {
  return (
    <SessionProvider>
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AuthWrapper>{children}</AuthWrapper>
      </NextThemesProvider>
    </SessionProvider>
  )
}
