'use client'

import { useState, useEffect } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Department {
  id: string
  name: string
  description?: string
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [departments, setDepartments] = useState<Department[]>([])
  const [loadingDepts, setLoadingDepts] = useState(false)
  const router = useRouter()

  // Fetch departments when registration form is shown
  useEffect(() => {
    if (isRegister && departments.length === 0) {
      fetchDepartments()
    }
  }, [isRegister])

  const fetchDepartments = async () => {
    setLoadingDepts(true)
    try {
      const res = await fetch('/api/departments')
      const data = await res.json()
      setDepartments(data)
    } catch (err) {
      console.error('Error fetching departments:', err)
      setError('Failed to load departments')
    } finally {
      setLoadingDepts(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      if (isRegister) {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name, 
            email, 
            password,
            departmentId: departmentId || null
          })
        })

        if (res.ok) {
          setIsRegister(false)
          setError('Registration successful! Please log in.')
          setName('')
          setEmail('')
          setPassword('')
          setDepartmentId('')
        } else {
          const data = await res.json()
          setError(data.error || 'Registration failed')
        }
      } else {
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        })

        if (result?.error) {
          setError('Invalid credentials')
        } else {
          const session = await getSession()
          if (session?.user?.role === 'ADMIN') {
            router.push('/admin/dashboard')
          } else {
            router.push('/dashboard')
          }
        }
      }
    } catch (error) {
      setError('An error occurred')
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg relative overflow-hidden">
      {/* Theme toggle in top-right corner */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 dark:from-white/5 dark:via-transparent dark:to-white/2"></div>
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl dark:bg-white/3"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-300/10 rounded-full blur-3xl dark:bg-blue-300/5"></div>
      </div>
      
      <Card className="card-enhanced w-full max-w-md mx-4 relative z-10">
        <CardHeader className="text-center pb-8">
          <div className="flex flex-col items-center space-y-6">
            <div className="p-8 bg-black rounded-3xl border border-gray-200 hover-lift shadow-2xl">
              <Image
                src="/amnex-logo.png"
                alt="Amnex Logo"
                width={96}
                height={96}
                className="object-contain"
                priority
              />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold text-primary">
                Resource Management
              </CardTitle>
              <p className="text-base text-muted-foreground text-center">
                {isRegister ? 'Create your account to get started' : 'Welcome back! Please sign in to continue'}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-enhanced"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department" className="text-sm font-medium">Department (Optional)</Label>
                  <Select value={departmentId} onValueChange={setDepartmentId} disabled={loadingDepts}>
                    <SelectTrigger id="department" className="input-enhanced">
                      <SelectValue placeholder={loadingDepts ? "Loading departments..." : "Select a department"} />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                          {dept.description && ` - ${dept.description}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Choose your department. You can update this later.</p>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-enhanced"
                placeholder="Enter your email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-enhanced"
                placeholder="Enter your password"
                required
              />
            </div>
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}
            <Button 
              type="submit" 
              className="btn-primary w-full h-12 text-base font-medium hover-lift" 
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                  <span>Please wait...</span>
                </div>
              ) : (
                isRegister ? 'Create Account' : 'Sign In'
              )}
            </Button>
          </form>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => setIsRegister(!isRegister)}
              className="text-sm text-primary hover:text-primary/80 font-medium"
            >
              {isRegister 
                ? 'Already have an account? Sign in instead' 
                : "Don't have an account? Create one now"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}