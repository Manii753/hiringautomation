'use client'

import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center h-screen">
      <Button onClick={() => signIn('google', { callbackUrl: '/' })}>Sign in with your workspace account</Button>
    </div>
  )
}
