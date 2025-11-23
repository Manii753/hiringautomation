'use client'

import { SessionProvider, useSession, signOut } from 'next-auth/react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'sonner'

function AuthWrapper({ children }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === 'loading') return

    // redirect to login if unauthenticated
    if (status === 'unauthenticated' && pathname !== '/login') {
      router.push('/login')
      return
    }

    // safe check for session error
    if (session?.error === 'RefreshAccessTokenError'|| session?.error === 'RefreshTokenNotFound') {
      toast.error('Session expired. Please sign in again.')
      signOut({ redirect: false }) // clear cookies
      router.push('/login')
    }
  }, [status, session, pathname, router])

  return <>{children}</>
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
