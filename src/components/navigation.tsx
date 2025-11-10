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
    <nav className="nav-enhanced sticky top-0 z-50 backdrop-blur-lg border-b border-border/10">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
        <div className="flex justify-between h-20">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="flex items-center space-x-5 group hover:scale-105 transition-transform duration-300">
                <div className="relative p-3 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-2xl border border-primary/20 group-hover:shadow-primary/20 transition-all duration-300">
                  <Image
                    src="/amnex-logo.png"
                    alt="Amnex Logo"
                    width={52}
                    height={52}
                    className="object-contain drop-shadow-md"
                    priority
                  />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent"></div>
                </div>
                <div className="flex flex-col space-y-1">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-primary/90 to-primary/80 bg-clip-text text-transparent leading-tight tracking-tight">
                    Resource Management
                  </h1>
                  <p className="text-sm text-muted-foreground/80 font-medium tracking-wide">Powered by Amnex</p>
                </div>
              </Link>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-2">
              {session.user.role === 'ADMIN' || session.user.userRole === 'ADMIN' ? (
                <>
                  <Link
                    href="/admin/dashboard"
                    className={`${
                      isActive('/admin/dashboard')
                        ? 'bg-primary/10 text-primary border-primary/20 shadow-md'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:border-border'
                    } inline-flex items-center px-4 py-3 border rounded-xl text-sm font-semibold transition-all duration-300 hover:shadow-md`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/admin/projects"
                    className={`${
                      isActive('/admin/projects')
                        ? 'bg-primary/10 text-primary border-primary/20 shadow-md'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:border-border'
                    } inline-flex items-center px-4 py-3 border rounded-xl text-sm font-semibold transition-all duration-300 hover:shadow-md`}
                  >
                    Projects
                  </Link>
                  <Link
                    href="/admin/resource-templates"
                    className={`${
                      isActive('/admin/resource-templates')
                        ? 'bg-primary/10 text-primary border-primary/20 shadow-md'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:border-border'
                    } inline-flex items-center px-4 py-3 border rounded-xl text-sm font-semibold transition-all duration-300 hover:shadow-md`}
                  >
                    Templates
                  </Link>
                  <Link
                    href="/admin/requests"
                    className={`${
                      isActive('/admin/requests')
                        ? 'bg-primary/10 text-primary border-primary/20 shadow-md'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:border-border'
                    } inline-flex items-center px-4 py-3 border rounded-xl text-sm font-semibold transition-all duration-300 hover:shadow-md`}
                  >
                    Requests
                  </Link>
                  <Link
                    href="/admin/it-tasks"
                    className={`${
                      isActive('/admin/it-tasks')
                        ? 'bg-primary/10 text-primary border-primary/20 shadow-md'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:border-border'
                    } inline-flex items-center px-4 py-3 border rounded-xl text-sm font-semibold transition-all duration-300 hover:shadow-md`}
                  >
                    IT Tasks
                  </Link>
                </>
              ) : session.user.userRole === 'DEPARTMENT_HEAD' || session.user.userRole === 'IT_HEAD' ? (
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
                    href="/admin/requests"
                    className={`${
                      isActive('/admin/requests')
                        ? 'border-primary text-primary bg-primary/5'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-primary/30'
                    } inline-flex items-center px-3 py-1 border-b-2 text-sm font-medium rounded-t-md transition-all duration-200`}
                  >
                    Approve Requests
                  </Link>
                  <Link
                    href="/my-requests"
                    className={`${
                      isActive('/my-requests')
                        ? 'border-primary text-primary bg-primary/5'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-primary/30'
                    } inline-flex items-center px-3 py-1 border-b-2 text-sm font-medium rounded-t-md transition-all duration-200`}
                  >
                    My Requests
                  </Link>
                </>
              ) : session.user.userRole === 'IT_TEAM' ? (
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
                    href="/admin/it-tasks"
                    className={`${
                      isActive('/admin/it-tasks')
                        ? 'border-primary text-primary bg-primary/5'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-primary/30'
                    } inline-flex items-center px-3 py-1 border-b-2 text-sm font-medium rounded-t-md transition-all duration-200`}
                  >
                    IT Tasks
                  </Link>
                  <Link
                    href="/my-requests"
                    className={`${
                      isActive('/my-requests')
                        ? 'border-primary text-primary bg-primary/5'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-primary/30'
                    } inline-flex items-center px-3 py-1 border-b-2 text-sm font-medium rounded-t-md transition-all duration-200`}
                  >
                    My Requests
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
                    href="/user/assigned-tasks"
                    className={`${
                      isActive('/user/assigned-tasks')
                        ? 'border-primary text-primary bg-primary/5'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-primary/30'
                    } inline-flex items-center px-3 py-1 border-b-2 text-sm font-medium rounded-t-md transition-all duration-200`}
                  >
                    My Assigned Tasks
                  </Link>
                  <Link
                    href="/my-requests"
                    className={`${
                      isActive('/my-requests')
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
          <div className="flex items-center space-x-6">
            <div className="hidden sm:flex items-center px-5 py-3 rounded-2xl bg-gradient-to-r from-muted/50 to-muted/30 border border-border/40 shadow-lg backdrop-blur-sm">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20">
                  <span className="text-sm font-bold text-primary">
                    {session.user.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">
                    {session.user.name}
                  </span>
                  <span className="text-xs px-2 py-1 bg-primary/15 text-primary rounded-lg border border-primary/20 font-medium">
                    {session.user.userRole || session.user.role}
                  </span>
                </div>
              </div>
            </div>
            <ThemeToggle />
            <Button 
              variant="outline" 
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}