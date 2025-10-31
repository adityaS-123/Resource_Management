'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import Navigation from '@/components/navigation'
import { 
  BarChart3, 
  Users, 
  Clock, 
  Activity,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Eye,
  Plus,
  FileText
} from 'lucide-react'

interface DashboardStats {
  totalProjects: number
  totalRequests: number
  pendingRequests: number
}

interface RecentRequest {
  id: string
  requestedType: string
  requestedCPU: number
  requestedRAM: number
  requestedQty: number
  user: {
    id: string
    name: string
    email: string
  }
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  phase: {
    name: string
    project: {
      name: string
    }
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    totalRequests: 0,
    pendingRequests: 0
  })
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [projectsRes, requestsRes] = await Promise.all([
          fetch('/api/projects'),
          fetch('/api/requests')
        ])

        const projects = await projectsRes.json()
        const requests = await requestsRes.json()

        const pendingRequests = requests.filter((r: any) => r.status === 'PENDING').length

        setStats({
          totalProjects: projects.length,
          totalRequests: requests.length,
          pendingRequests
        })

        setRecentRequests(requests.slice(0, 5))
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div>
        <Navigation />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0 space-y-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-10 w-32" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-64" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-64" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Navigation />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Enhanced Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
              <p className="text-gray-600">Manage projects, resources, and user requests</p>
            </div>
            <div className="flex gap-3 mt-4 sm:mt-0">
              <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <Link href="/admin/projects/new">
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin/projects">
                  <FileText className="h-4 w-4 mr-2" />
                  All Projects
                </Link>
              </Button>
            </div>
          </div>
          
          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card className="card-enhanced hover-lift border-l-4 border-l-primary">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Total Projects</p>
                    <p className="text-3xl font-bold text-primary">{stats.totalProjects}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center">
                      <span className="w-1 h-1 bg-emerald-500 rounded-full mr-1"></span>
                      Active and completed
                    </p>
                  </div>
                  <div className="bg-primary/10 p-3 rounded-xl border border-primary/20">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-enhanced hover-lift border-l-4 border-l-purple-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Resource Requests</p>
                    <p className="text-3xl font-bold text-purple-600">{stats.totalRequests}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center">
                      <span className="w-1 h-1 bg-purple-500 rounded-full mr-1"></span>
                      All time requests
                    </p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-xl border border-purple-200">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-enhanced hover-lift border-l-4 border-l-amber-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Pending Requests</p>
                    <p className="text-3xl font-bold text-amber-600">{stats.pendingRequests}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center">
                      <span className="w-1 h-1 bg-amber-500 rounded-full mr-1 animate-pulse"></span>
                      Awaiting approval
                    </p>
                  </div>
                  <div className="bg-amber-100 p-3 rounded-xl border border-amber-200">
                    <Clock className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-8">
            <Card className="card-enhanced">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border/50">
                <CardTitle className="flex items-center gap-2 text-primary">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Activity className="h-5 w-5" />
                  </div>
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button asChild className="btn-primary h-12 hover-lift" variant="default">
                    <Link href="/admin/projects/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Project
                    </Link>
                  </Button>
                  <Button asChild className="btn-secondary h-12 hover-lift" variant="outline">
                    <Link href="/admin/requests">
                      <Eye className="h-4 w-4 mr-2" />
                      Review Requests ({stats.pendingRequests})
                    </Link>
                  </Button>
                  <Button asChild className="btn-secondary h-12 hover-lift" variant="outline">
                    <Link href="/admin/projects">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View All Projects
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Requests */}
          <Card className="card-enhanced">
            <CardHeader className="bg-gradient-to-r from-secondary/5 to-secondary/10 border-b border-border/50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-primary">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Clock className="h-5 w-5" />
                  </div>
                  Recent Resource Requests
                </CardTitle>
                <Button asChild variant="outline" size="sm" className="hover-lift">
                  <Link href="/admin/requests">
                    View All
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentRequests.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="mx-auto h-16 w-16 mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">No Recent Requests</h3>
                  <p>Resource requests will appear here when users submit them.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {request.user.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-900">{request.user.name}</p>
                            <Badge
                              variant={
                                request.status === 'APPROVED' ? 'default' :
                                request.status === 'REJECTED' ? 'destructive' :
                                'secondary'
                              }
                              className={`text-xs ${
                                request.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                request.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}
                            >
                              {request.status === 'PENDING' && <Clock className="h-3 w-3 mr-1" />}
                              {request.status === 'APPROVED' && <CheckCircle className="h-3 w-3 mr-1" />}
                              {request.status === 'REJECTED' && <AlertCircle className="h-3 w-3 mr-1" />}
                              {request.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            {request.requestedType}: {request.requestedCPU} CPU, {request.requestedRAM}GB RAM, Qty: {request.requestedQty}
                          </p>
                          <p className="text-xs text-gray-500">
                            {request.phase.project.name} • {request.phase.name} • {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/admin/requests`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}        