'use client'

import { useEffect } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    // If session exists, redirect to home
    if (status === 'authenticated') {
      router.replace('/')
    }
  }, [status, router])

  // Optional: prevent flicker while session is loading
  if (status === 'loading') {
    return (
      <div className="h-[calc(100vh-69px)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Only render login form if user is not authenticated
  if (status === 'unauthenticated') {
    return (
      <div className="h-[calc(100vh-69px)] bg-background flex items-center justify-center">
        <Card className="w-full max-w-md p-6 space-y-4">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Hiring Automation</CardTitle>
            <CardDescription>Sign in to your workspace</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => signIn('google', { callbackUrl: '/' })} className="w-full">
              Sign in with your workspace account
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}

