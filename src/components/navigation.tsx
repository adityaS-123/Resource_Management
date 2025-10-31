'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'

export default function Navigation() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const isActive = (path: string) => pathname.startsWith(path)

  if (!session) return null

  return (
    <nav className="nav-enhanced sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="flex items-center space-x-4 hover-lift">
                <div className="p-2 rounded-xl bg-black shadow-lg border border-gray-200">
                  <Image
                    src="/amnex-logo.png"
                    alt="Amnex Logo"
                    width={56}
                    height={56}
                    className="object-contain"
                    priority
                  />
                </div>
                <div className="flex flex-col">
                  <h1 className="text-xl font-bold text-primary leading-tight">
                    Resource Management
                  </h1>
                  <p className="text-xs text-muted-foreground">Powered by Amnex</p>
                </div>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {session.user.role === 'ADMIN' ? (
                <>
                  <Link
                    href="/admin/dashboard"
                    className={`${
                      isActive('/admin/dashboard')
                        ? 'border-primary text-primary bg-primary/5'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-primary/30'
                    } inline-flex items-center px-3 py-1 border-b-2 text-sm font-medium rounded-t-md transition-all duration-200`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/admin/projects"
                    className={`${
                      isActive('/admin/projects')
                        ? 'border-primary text-primary bg-primary/5'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-primary/30'
                    } inline-flex items-center px-3 py-1 border-b-2 text-sm font-medium rounded-t-md transition-all duration-200`}
                  >
                    Projects
                  </Link>
                  <Link
                    href="/admin/resource-templates"
                    className={`${
                      isActive('/admin/resource-templates')
                        ? 'border-primary text-primary bg-primary/5'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-primary/30'
                    } inline-flex items-center px-3 py-1 border-b-2 text-sm font-medium rounded-t-md transition-all duration-200`}
                  >
                    Resource Templates
                  </Link>
                  <Link
                    href="/admin/requests"
                    className={`${
                      isActive('/admin/requests')
                        ? 'border-primary text-primary bg-primary/5'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-primary/30'
                    } inline-flex items-center px-3 py-1 border-b-2 text-sm font-medium rounded-t-md transition-all duration-200`}
                  >
                    Requests
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/dashboard"
                    className={`${
                      isActive('/dashboard')
                        ? 'border-primary text-primary bg-primary/5'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-primary/30'
                    } inline-flex items-center px-3 py-1 border-b-2 text-sm font-medium rounded-t-md transition-all duration-200`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/user/requests"
                    className={`${
                      isActive('/user/requests')
                        ? 'border-primary text-primary bg-primary/5'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-primary/30'
                    } inline-flex items-center px-3 py-1 border-b-2 text-sm font-medium rounded-t-md transition-all duration-200`}
                  >
                    My Requests
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center px-3 py-1 rounded-full bg-secondary/50 border border-border/30">
              <span className="text-sm font-medium text-secondary-foreground">
                {session.user.name}
              </span>
              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full border border-primary/20">
                {session.user.role}
              </span>
            </div>
            <ThemeToggle />
            <Button 
              variant="outline" 
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="btn-secondary hover-lift"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}