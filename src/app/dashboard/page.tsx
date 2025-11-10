'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import Navigation from '@/components/navigation'
import { 
  FolderOpen, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp,
  Users,
  Server,
  Calendar,
  Plus,
  Eye,
  Activity,
  BarChart3
} from 'lucide-react'

interface Project {
  id: string
  name: string
  client: string
  startDate: string
  endDate: string
  phases: Phase[]
}

interface Phase {
  id: string
  name: string
  duration: number
  allocatedCost: number
  resources: Resource[]
}

interface Resource {
  id: string
  type: string
  cpuCores: number
  ramGB: number
  diskGB: number | null
  quantity: number
}

interface DashboardStats {
  totalProjects: number
  totalRequests: number
  pendingRequests: number
  completedRequests: number
}

export default function UserDashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    totalRequests: 0,
    pendingRequests: 0,
    completedRequests: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [projectsRes, requestsRes] = await Promise.all([
          fetch('/api/projects'),
          fetch('/api/requests')
        ])

        const projectsData = await projectsRes.json()
        const requestsData = await requestsRes.json()

        setProjects(projectsData)

        const pendingRequests = requestsData.filter((r: any) => r.status === 'PENDING').length
        const completedRequests = requestsData.filter((r: any) => r.status === 'COMPLETED').length

        setStats({
          totalProjects: projectsData.length,
          totalRequests: requestsData.length,
          pendingRequests,
          completedRequests
        })
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
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Navigation />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="space-y-8 animate-pulse">
            <div className="h-20 bg-muted/30 rounded-2xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted/30 rounded-2xl"></div>
              ))}
            </div>
            <div className="h-96 bg-muted/30 rounded-2xl"></div>
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
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-2">Welcome to Resource Management! Here&apos;s what&apos;s happening with your projects.</p>
            </div>
            <div className="flex gap-3">
              <Link href="/user/requests/new">
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  New Request
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="card-enhanced hover-lift border-l-4 border-l-primary">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-primary">
                    My Projects
                  </CardTitle>
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FolderOpen className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stats.totalProjects}</div>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-emerald-600" />
                  <span className="text-xs text-muted-foreground">Active projects</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="card-enhanced hover-lift border-l-4 border-l-purple-500">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-purple-700">
                    Total Requests
                  </CardTitle>
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Activity className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{stats.totalRequests}</div>
                <div className="flex items-center gap-1 mt-1">
                  <BarChart3 className="h-3 w-3 text-purple-600" />
                  <span className="text-xs text-muted-foreground">All time</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="card-enhanced hover-lift border-l-4 border-l-amber-500">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-amber-700">
                    Pending Requests
                  </CardTitle>
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">
                  {stats.pendingRequests}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3 text-amber-600 animate-pulse" />
                  <span className="text-xs text-muted-foreground">Awaiting approval</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="card-enhanced hover-lift border-l-4 border-l-emerald-500">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-emerald-700">
                    Completed Requests
                  </CardTitle>
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  {stats.completedRequests}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <CheckCircle className="h-3 w-3 text-emerald-600" />
                  <span className="text-xs text-muted-foreground">Resources delivered</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Projects Section */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <FolderOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">My Projects</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Projects you&apos;re currently working on</p>
                  </div>
                </div>
                <Link href="/user/requests/new">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Request Resources
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {projects.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <FolderOpen className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No projects yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">You haven&apos;t been assigned to any projects yet.</p>
                  <Link href="/user/requests/new">
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Request Project Resources
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid gap-6">
                  {projects.map((project) => {
                    const totalResources = project.phases.reduce((total, phase) => 
                      total + phase.resources.reduce((phaseTotal, resource) => phaseTotal + resource.quantity, 0), 0
                    )
                    const daysRemaining = Math.ceil((new Date(project.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                    const progress = Math.max(0, Math.min(100, 
                      ((new Date().getTime() - new Date(project.startDate).getTime()) / 
                       (new Date(project.endDate).getTime() - new Date(project.startDate).getTime())) * 100
                    ))

                    return (
                      <Card key={project.id} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{project.name}</h3>
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {project.client}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Server className="h-4 w-4" />
                                  {totalResources} resources
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Link href={`/user/projects/${project.id}`}>
                                <Button variant="outline" size="sm" className="flex items-center gap-2">
                                  <Eye className="h-4 w-4" />
                                  View Details
                                </Button>
                              </Link>
                            </div>
                          </div>
                          
                          {/* Project Progress */}
                          <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Project Progress</span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                            <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                              <span>{daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Project completed'}</span>
                              <span>{project.phases.length} phases</span>
                            </div>
                          </div>

                          <Separator className="my-4" />

                          {/* Project Stats */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{project.phases.length}</div>
                              <div className="text-xs text-blue-600 dark:text-blue-400">Phases</div>
                            </div>
                            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                              <div className="text-lg font-bold text-green-600 dark:text-green-400">{totalResources}</div>
                              <div className="text-xs text-green-600 dark:text-green-400">Resources</div>
                            </div>
                          </div>

                          {/* Resource Summary */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                              <Server className="h-4 w-4" />
                              Available Resources
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {project.phases.flatMap(phase => 
                                phase.resources.map(resource => (
                                  <Badge 
                                    key={`${phase.id}-${resource.id}`} 
                                    variant="secondary"
                                    className="text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                                  >
                                    <Server className="h-3 w-3 mr-1" />
                                    {resource.type}: {resource.cpuCores}CPU/{resource.ramGB}GB 
                                    {resource.diskGB && `/${resource.diskGB}GB`} (×{resource.quantity})
                                  </Badge>
                                ))
                              )}
                              {project.phases.flatMap(phase => phase.resources).length === 0 && (
                                <span className="text-sm text-gray-500 dark:text-gray-400 italic">No resources allocated</span>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}