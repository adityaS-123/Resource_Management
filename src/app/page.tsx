'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function Home() {
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (session) {
      // Redirect based on user role
      if (session.user.role === 'ADMIN') {
        router.push('/admin/dashboard')
      } else {
        router.push('/dashboard')
      }
    } else {
      router.push('/login')
    }
  }, [session, status, router])

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 dark:from-white/5 dark:via-transparent dark:to-white/2"></div>
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-white/5 rounded-full blur-3xl dark:bg-white/3"></div>
        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-blue-300/10 rounded-full blur-3xl dark:bg-blue-300/5"></div>
      </div>
      
      <div className="text-center relative z-10">
        <div className="flex flex-col items-center space-y-8 mb-12">
          <div className="p-8 bg-black/20 backdrop-blur-md rounded-3xl border border-white/30 hover-lift shadow-2xl">
            <img
              src="/amnex-logo.png"
              alt="Amnex Logo"
              className="w-32 h-32 object-contain"
            />
          </div>
          <div className="space-y-3 text-center">
            <h1 className="text-5xl font-bold text-white drop-shadow-lg">Resource Management</h1>
            <p className="text-white/90 text-xl font-medium">Powered by Amnex</p>
          </div>
        </div>
        <div className="flex items-center justify-center space-x-3 text-white/60">
          <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse"></div>
          <p className="text-lg">Loading your dashboard...</p>
          <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse delay-75"></div>
        </div>
      </div>
    </div>
  )
}